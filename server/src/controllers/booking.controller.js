import Booking from "../models/Booking.model.js";
import Restaurant from "../models/Restaurant.model.js";

const assertOwner = async (userId, restaurantId) => {
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) return { ok: false, status: 404, message: "Restaurant not found" };
  if (restaurant.owner.toString() !== userId.toString())
    return { ok: false, status: 403, message: "Forbidden: you do not own this restaurant" };
  return { ok: true, restaurant };
};

/**
 * GET /api/owner/restaurants/:restaurantId/bookings
 */
export const getBookings = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const { status, date, page = 1, limit = 20 } = req.query;

    const check = await assertOwner(req.user._id, restaurantId);
    if (!check.ok) return res.status(check.status).json({ success: false, message: check.message });

    const filter = { restaurant: restaurantId };
    if (status) filter.status = status;
    if (date) filter.date = date;

    const skip = (Number(page) - 1) * Number(limit);

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .sort({ date: 1, time: 1 })
        .skip(skip)
        .limit(Number(limit)),
      Booking.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      data: bookings,
      meta: { total, page: Number(page), limit: Number(limit) }
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/owner/restaurants/:restaurantId/bookings
 */
export const createBooking = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const { customerName, customerPhone, customerEmail, date, time, partySize, notes } = req.body;

    const check = await assertOwner(req.user._id, restaurantId);
    if (!check.ok) return res.status(check.status).json({ success: false, message: check.message });

    if (!customerName || !customerPhone || !date || !time || !partySize) {
      return res.status(400).json({
        success: false,
        message: "customerName, customerPhone, date, time and partySize are required"
      });
    }

    const booking = await Booking.create({
      restaurant: restaurantId,
      customerName,
      customerPhone,
      customerEmail,
      date,
      time,
      partySize,
      notes
    });

    return res.status(201).json({ success: true, data: booking });
  } catch (error) {
    return next(error);
  }
};

/**
 * PATCH /api/owner/bookings/:bookingId/status
 */
export const updateBookingStatus = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    const VALID = ["pending", "confirmed", "cancelled", "completed", "no_show"];
    if (!status || !VALID.includes(status)) {
      return res.status(400).json({ success: false, message: `status must be one of: ${VALID.join(", ")}` });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    const check = await assertOwner(req.user._id, booking.restaurant);
    if (!check.ok) return res.status(check.status).json({ success: false, message: check.message });

    booking.status = status;
    await booking.save();

    return res.status(200).json({ success: true, data: booking });
  } catch (error) {
    return next(error);
  }
};

/**
 * PUT /api/owner/bookings/:bookingId
 */
export const updateBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    const check = await assertOwner(req.user._id, booking.restaurant);
    if (!check.ok) return res.status(check.status).json({ success: false, message: check.message });

    const fields = ["customerName", "customerPhone", "customerEmail", "date", "time", "partySize", "notes", "status"];
    fields.forEach((f) => { if (req.body[f] !== undefined) booking[f] = req.body[f]; });
    const updated = await booking.save();

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    return next(error);
  }
};

/**
 * DELETE /api/owner/bookings/:bookingId
 */
export const deleteBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    const check = await assertOwner(req.user._id, booking.restaurant);
    if (!check.ok) return res.status(check.status).json({ success: false, message: check.message });

    await booking.deleteOne();
    return res.status(200).json({ success: true, message: "Booking deleted" });
  } catch (error) {
    return next(error);
  }
};
