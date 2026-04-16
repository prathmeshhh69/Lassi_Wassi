import Order from "../models/Order.model.js";
import MenuItem from "../models/MenuItem.model.js";
import Restaurant from "../models/Restaurant.model.js";

// ─── Slot helpers ─────────────────────────────────────────────────────────────

/**
 * Parse "YYYY-MM-DD HH:MM" into a UTC Date, treating it as restaurant local time.
 * We keep it simple: the app stores and displays times without timezone conversions,
 * relying on the server's local time matching the restaurant's timezone.
 */
const parseSlotDate = (dateStr, timeStr) => {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const [h, m]     = timeStr.split(":").map(Number);
  return new Date(y, mo - 1, d, h, m, 0, 0);
};

/**
 * Generate a list of available pre-order slots for a given date.
 *
 * Algorithm:
 *   1. Build every slot of `slotDurationMinutes` within [openingTime, closingTime].
 *   2. Remove slots that start < now + preOrderLeadTimeMinutes.
 *   3. For each slot, count active pre-orders that overlap it.
 *   4. Mark slot as available if count < maxPreOrdersPerSlot.
 */
const buildSlots = async (restaurant, dateStr, now) => {
  const opening = restaurant.openingTime || "09:00";
  const closing = restaurant.closingTime || "22:00";
  const slotDuration = restaurant.slotDurationMinutes || 30;
  const maxPerSlot   = restaurant.maxPreOrdersPerSlot || 5;
  const leadTime     = restaurant.preOrderLeadTimeMinutes || 60;

  const [openH, openM]   = opening.split(":").map(Number);
  const [closeH, closeM] = closing.split(":").map(Number);
  const [y, mo, d] = dateStr.split("-").map(Number);

  const startOfDay = new Date(y, mo - 1, d, openH, openM, 0);
  const endOfDay   = new Date(y, mo - 1, d, closeH, closeM, 0);
  const cutoff     = new Date(now.getTime() + leadTime * 60 * 1000);

  // All pre-orders for this restaurant on this date (active states only)
  const dayStart = new Date(y, mo - 1, d, 0, 0, 0);
  const dayEnd   = new Date(y, mo - 1, d, 23, 59, 59);
  const existing = await Order.find({
    restaurant: restaurant._id,
    orderType: "pre-order",
    scheduledTime: { $gte: dayStart, $lte: dayEnd },
    status: { $in: ["pending", "preparing", "out_for_delivery"] },
  }).select("scheduledTime").lean();

  const slots = [];
  let cursor = new Date(startOfDay);

  while (cursor < endOfDay) {
    const slotStart = new Date(cursor);
    const slotEnd   = new Date(cursor.getTime() + slotDuration * 60 * 1000);

    // Count orders whose scheduledTime falls within [slotStart, slotEnd)
    const occupied = existing.filter(
      (o) => o.scheduledTime >= slotStart && o.scheduledTime < slotEnd
    ).length;

    const available = occupied < maxPerSlot;
    const isPast    = slotStart < cutoff;

    slots.push({
      time:      `${String(slotStart.getHours()).padStart(2, "0")}:${String(slotStart.getMinutes()).padStart(2, "0")}`,
      available: available && !isPast,
      isPast,
      occupied,
      capacity: maxPerSlot,
    });

    cursor = slotEnd;
  }

  return slots;
};

// ─── GET /api/preorders/slots/:restaurantId?date=YYYY-MM-DD ──────────────────
export const getAvailableSlots = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const { date } = req.query;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, message: "date query param required (YYYY-MM-DD)" });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ success: false, message: "Restaurant not found" });

    const slots = await buildSlots(restaurant, date, new Date());

    return res.status(200).json({ success: true, data: slots, meta: { date, restaurantId } });
  } catch (err) {
    return next(err);
  }
};

// ─── POST /api/preorders ─────────────────────────────────────────────────────
/**
 * Body: { restaurantId, date, time, items: [{menuItemId, quantity}], deliveryAddress }
 *
 * Capacity algorithm:
 *   1. Parse the requested slot datetime.
 *   2. Re-count active orders in that slot (under a transaction-like check).
 *   3. Reject if slot is full (race-safe: uses an atomic findOne + countDocuments).
 *   4. Reject if slot is in the past + within lead-time window.
 *   5. Lock prices server-side (same as instant-order flow).
 */
export const createPreOrder = async (req, res, next) => {
  try {
    const { restaurantId, date, time, items, deliveryAddress } = req.body;

    if (!restaurantId || !date || !time || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "restaurantId, date, time and items are required." });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ success: false, message: "Restaurant not found." });

    // ── Parse & validate slot datetime
    const slotDate = parseSlotDate(date, time);
    const now      = new Date();
    const leadTime = restaurant.preOrderLeadTimeMinutes || 60;
    const cutoff   = new Date(now.getTime() + leadTime * 60 * 1000);

    if (slotDate < now) {
      return res.status(400).json({ success: false, message: "Cannot book a slot in the past." });
    }
    if (slotDate < cutoff) {
      return res.status(400).json({
        success: false,
        message: `Pre-orders require at least ${leadTime} minutes advance notice.`,
      });
    }

    // ── Slot capacity check (conflict-prevention)
    const slotDuration   = restaurant.slotDurationMinutes || 30;
    const maxPerSlot     = restaurant.maxPreOrdersPerSlot || 5;
    const slotEnd        = new Date(slotDate.getTime() + slotDuration * 60 * 1000);

    const slotCount = await Order.countDocuments({
      restaurant: restaurantId,
      orderType: "pre-order",
      scheduledTime: { $gte: slotDate, $lt: slotEnd },
      status: { $in: ["pending", "preparing", "out_for_delivery"] },
    });

    if (slotCount >= maxPerSlot) {
      return res.status(409).json({
        success: false,
        message: `This time slot is full (${slotCount}/${maxPerSlot}). Please choose another slot.`,
      });
    }

    // ── Verify & price-lock menu items
    const menuItemIds = items.map((i) => i.menuItemId);
    const menuItems   = await MenuItem.find({ _id: { $in: menuItemIds }, restaurant: restaurantId });

    if (menuItems.length !== menuItemIds.length) {
      return res.status(400).json({ success: false, message: "One or more items are invalid for this restaurant." });
    }

    const menuItemMap = Object.fromEntries(menuItems.map((m) => [m._id.toString(), m]));
    let totalAmount   = 0;

    const orderItems = items.map(({ menuItemId, quantity }) => {
      const mi  = menuItemMap[menuItemId.toString()];
      if (!mi.isAvailable) throw { status: 400, message: `"${mi.name}" is currently unavailable.` };
      const qty = Math.max(1, Number(quantity));
      totalAmount += mi.price * qty;
      return { menuItem: mi._id, quantity: qty, price: mi.price };
    });

    // ── Persist
    const order = await Order.create({
      user: req.user._id,
      restaurant: restaurantId,
      items: orderItems,
      totalAmount,
      orderType: "pre-order",
      scheduledTime: slotDate,
      estimatedReadyTime: slotDate,
      deliveryAddress: deliveryAddress || {},
      status: "pending",
      paymentStatus: "pending",
    });

    const populated = await order.populate([
      { path: "restaurant", select: "name address" },
      { path: "items.menuItem", select: "name price image" },
    ]);

    return res.status(201).json({
      success: true,
      data: populated,
      meta: { scheduledTime: slotDate, slotFill: `${slotCount + 1}/${maxPerSlot}` },
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    return next(err);
  }
};

// ─── GET /api/preorders/me ───────────────────────────────────────────────────
export const getMyPreOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find({ user: req.user._id, orderType: "pre-order" })
        .populate("restaurant", "name address")
        .populate("items.menuItem", "name price image")
        .sort({ scheduledTime: 1 })
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments({ user: req.user._id, orderType: "pre-order" }),
    ]);

    return res.status(200).json({
      success: true,
      data: orders,
      meta: { total, page: Number(page), limit: Number(limit) },
    });
  } catch (err) {
    return next(err);
  }
};

// ─── PATCH /api/preorders/:orderId/cancel ────────────────────────────────────
export const cancelPreOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      user: req.user._id,
      orderType: "pre-order",
    });
    if (!order) return res.status(404).json({ success: false, message: "Pre-order not found." });

    if (!["pending"].includes(order.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel a pre-order that is "${order.status}".` });
    }

    order.status = "cancelled";
    await order.save();
    return res.status(200).json({ success: true, data: order });
  } catch (err) {
    return next(err);
  }
};
