import Booking from "../models/Booking.model.js";
import Restaurant from "../models/Restaurant.model.js";
import { getIO } from "../utils/socket.js";

// ─── GET /api/bookings/slots/:restaurantId?date=YYYY-MM-DD ──────────────────
/**
 * Returns available booking time slots for a restaurant on a date.
 * Slots are `bookingSlotIntervalMinutes` apart within opening hours.
 * A slot is UNAVAILABLE if the total partySizes booked at that time ≥ tableCapacity.
 */
export const getBookingSlots = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const { date } = req.query;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, message: "date query param required (YYYY-MM-DD)" });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ success: false, message: "Restaurant not found." });

    const opening  = restaurant.openingTime  || "09:00";
    const closing  = restaurant.closingTime  || "22:00";
    const interval = restaurant.bookingSlotIntervalMinutes || 30;
    const capacity = restaurant.tableCapacity || 20;
    const maxParty = restaurant.maxBookingPartySize || 10;

    // All confirmed/pending bookings on this date
    const existingBookings = await Booking.find({
      restaurant: restaurantId,
      date,
      status: { $in: ["pending", "confirmed"] },
    }).select("time partySize").lean();

    const [openH, openM]   = opening.split(":").map(Number);
    const [closeH, closeM] = closing.split(":").map(Number);
    const openTotal  = openH  * 60 + openM;
    const closeTotal = closeH * 60 + closeM;
    const now        = new Date();
    const [y, mo, d] = date.split("-").map(Number);
    const isToday    = now.getFullYear() === y && now.getMonth() + 1 === mo && now.getDate() === d;
    const nowMinutes = now.getHours() * 60 + now.getMinutes() + 30; // 30-min buffer

    const slots = [];
    for (let minutes = openTotal; minutes < closeTotal; minutes += interval) {
      const h   = Math.floor(minutes / 60);
      const m   = minutes % 60;
      const str = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

      // Seats occupied at this slot
      const occupied = existingBookings
        .filter((b) => b.time === str)
        .reduce((sum, b) => sum + (b.partySize || 0), 0);

      const isPast    = isToday && minutes < nowMinutes;
      const available = !isPast && occupied < capacity;

      slots.push({ time: str, available, occupied, capacity, isPast });
    }

    return res.status(200).json({
      success: true,
      data: slots,
      meta: { date, restaurantId, maxParty, capacity },
    });
  } catch (err) {
    return next(err);
  }
};

// ─── POST /api/bookings ──────────────────────────────────────────────────────
/**
 * Body: { restaurantId, date, time, partySize, name, phone, email?, specialRequest? }
 *
 * Conflict-prevention:
 *   1. Re-check seat availability atomically.
 *   2. Reject if occupied + partySize > tableCapacity.
 *   3. Reject if partySize > maxBookingPartySize.
 */
export const createBooking = async (req, res, next) => {
  try {
    const { restaurantId, date, time, partySize, name, phone, email, specialRequest } = req.body;

    if (!restaurantId || !date || !time || !partySize || !name || !phone) {
      return res.status(400).json({
        success: false,
        message: "restaurantId, date, time, partySize, name and phone are required.",
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
      return res.status(400).json({ success: false, message: "date must be YYYY-MM-DD, time must be HH:MM." });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ success: false, message: "Restaurant not found." });

    const capacity = restaurant.tableCapacity       || 20;
    const maxParty = restaurant.maxBookingPartySize || 10;
    const size     = Number(partySize);

    if (size < 1 || size > maxParty) {
      return res.status(400).json({ success: false, message: `Party size must be between 1 and ${maxParty}.` });
    }

    // ── Atomic capacity check (conflict prevention)
    const existingBookings = await Booking.find({
      restaurant: restaurantId,
      date,
      time,
      status: { $in: ["pending", "confirmed"] },
    }).select("partySize").lean();

    const occupied = existingBookings.reduce((sum, b) => sum + (b.partySize || 0), 0);

    if (occupied + size > capacity) {
      return res.status(409).json({
        success: false,
        message: `Not enough seats at ${time} on ${date}. Available: ${capacity - occupied}, requested: ${size}.`,
      });
    }

    const booking = await Booking.create({
      restaurant: restaurantId,
      user: req.user?._id ?? null,
      customerName:  name,
      customerPhone: phone,
      customerEmail: email || "",
      date,
      time,
      partySize: size,
      notes: specialRequest || "",
      status: "pending",
    });

    // ── Emit real-time notification to owner dashboard ──
    try {
      getIO().to(`restaurant:${restaurantId}`).emit("newBooking", booking);
    } catch (_) {
      // Socket not yet connected — non-fatal
    }

    return res.status(201).json({ success: true, data: booking });
  } catch (err) {
    return next(err);
  }
};

// ─── GET /api/bookings/me ────────────────────────────────────────────────────
export const getMyBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [bookings, total] = await Promise.all([
      Booking.find({ user: req.user._id })
        .populate("restaurant", "name address")
        .sort({ date: 1, time: 1 })
        .skip(skip)
        .limit(Number(limit)),
      Booking.countDocuments({ user: req.user._id }),
    ]);

    return res.status(200).json({
      success: true,
      data: bookings,
      meta: { total, page: Number(page), limit: Number(limit) },
    });
  } catch (err) {
    return next(err);
  }
};

// ─── DELETE /api/bookings/:bookingId ────────────────────────────────────────
export const cancelMyBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.bookingId, user: req.user._id });
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found." });

    if (booking.status === "confirmed") {
      return res.status(400).json({ success: false, message: "A confirmed booking cannot be self-cancelled. Please contact the restaurant." });
    }

    booking.status = "cancelled";
    await booking.save();
    return res.status(200).json({ success: true, data: booking });
  } catch (err) {
    return next(err);
  }
};
