import Order from "../models/Order.model.js";
import MenuItem from "../models/MenuItem.model.js";
import Restaurant from "../models/Restaurant.model.js";
import { getIO } from "../utils/socket.js";

// ─── ETA helpers ────────────────────────────────────────────────────────────

/**
 * Smart ETA in minutes.
 *
 * Formula:
 *   basePrep   = max preparationTime of all ordered items (items cook in parallel)
 *   queueDelay = activeOrders * PER_ORDER_BUFFER  (each active order adds kitchen lag)
 *   delivery   = DELIVERY_MINUTES (fixed transit estimate)
 *   ETA = basePrep + queueDelay + delivery
 */
const PER_ORDER_BUFFER = 5;  // minutes of extra lag per active order
const DELIVERY_MINUTES = 30; // flat delivery transit

async function computeETA(restaurantId, maxPrepTime) {
  const activeOrders = await Order.countDocuments({
    restaurant: restaurantId,
    status: { $in: ["pending", "preparing"] },
  });
  const totalMinutes = maxPrepTime + activeOrders * PER_ORDER_BUFFER + DELIVERY_MINUTES;
  return { totalMinutes, activeOrders };
}

// ─── Create Order ────────────────────────────────────────────────────────────

/**
 * POST /api/orders
 * Body: { restaurantId, items: [{menuItemId, quantity}], deliveryAddress }
 */
export const createOrder = async (req, res, next) => {
  try {
    const { restaurantId, items, deliveryAddress, orderType = "instant", scheduledTime, specialInstructions } = req.body;

    // ── Basic validation
    if (!restaurantId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "restaurantId and items are required." });
    }

    // ── Pre-order validation
    if (orderType === "pre-order") {
      if (!scheduledTime) {
        return res.status(400).json({ success: false, message: "scheduledTime is required for pre-orders." });
      }
      const scheduled = new Date(scheduledTime);
      if (isNaN(scheduled.getTime())) {
        return res.status(400).json({ success: false, message: "scheduledTime is not a valid date." });
      }
      const minAllowed = new Date(Date.now() + 10 * 60 * 1000);
      if (scheduled < minAllowed) {
        return res.status(400).json({ success: false, message: "Scheduled pickup time must be at least 10 minutes from now." });
      }
    }

    // ── Verify restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found." });
    }

    // ── Fetch menu items from DB to lock prices server-side (never trust client prices)
    const menuItemIds = items.map((i) => i.menuItemId);
    const menuItems = await MenuItem.find({ _id: { $in: menuItemIds }, restaurant: restaurantId });

    if (menuItems.length !== menuItemIds.length) {
      return res.status(400).json({ success: false, message: "One or more items are invalid or do not belong to this restaurant." });
    }

    const menuItemMap = Object.fromEntries(menuItems.map((m) => [m._id.toString(), m]));

    // ── Build order items with server-side prices
    let totalAmount = 0;
    let maxPrepTime = 0;

    const orderItems = items.map(({ menuItemId, quantity }) => {
      const mi = menuItemMap[menuItemId.toString()];
      if (!mi.isAvailable) throw { status: 400, message: `"${mi.name}" is currently unavailable.` };
      const qty = Math.max(1, Number(quantity));
      totalAmount += mi.price * qty;
      maxPrepTime = Math.max(maxPrepTime, mi.preparationTime || 15);
      return { menuItem: mi._id, quantity: qty, price: mi.price };
    });

    // ── ETA
    const { totalMinutes } = await computeETA(restaurantId, maxPrepTime);
    const estimatedDeliveryTime = new Date(Date.now() + totalMinutes * 60 * 1000);

    const { fulfillmentType = "delivery" } = req.body;

    // ── Persist
    const order = await Order.create({
      user: req.user._id,
      restaurant: restaurantId,
      items: orderItems,
      totalAmount,
      deliveryAddress: deliveryAddress || {},
      estimatedDeliveryTime,
      orderType: orderType === "pre-order" ? "pre-order" : "instant",
      scheduledTime: orderType === "pre-order" ? new Date(scheduledTime) : null,
      fulfillmentType: fulfillmentType === "pickup" ? "pickup" : "delivery",
      status: "pending",
      paymentStatus: "pending",
      specialInstructions: (specialInstructions || "").trim().slice(0, 300),
    });

    const populated = await order.populate([
      { path: "restaurant", select: "name address averagePreparationTime" },
      { path: "user", select: "name phone email" },
      { path: "items.menuItem", select: "name price image" },
    ]);

    // ── Emit real-time notification to owner dashboard
    try {
      getIO().to(`restaurant:${restaurantId}`).emit("newOrder", populated);
    } catch (_) {
      // Socket not yet connected — non-fatal
    }

    return res.status(201).json({
      success: true,
      data: populated,
      meta: { etaMinutes: totalMinutes },
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    return next(err);
  }
};

// ─── Get My Orders ───────────────────────────────────────────────────────────

/**
 * GET /api/orders/me?page=1&limit=10&status=pending
 */
export const getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const VALID_STATUSES = ["pending", "preparing", "out_for_delivery", "completed", "cancelled"];

    const filter = { user: req.user._id };
    if (status && VALID_STATUSES.includes(status)) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("restaurant", "name address")
        .populate("items.menuItem", "name price image")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: orders,
      meta: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    return next(err);
  }
};

// ─── Get Single Order ────────────────────────────────────────────────────────

/**
 * GET /api/orders/:orderId
 * User can only see their own orders.
 */
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, user: req.user._id })
      .populate("restaurant", "name address averagePreparationTime")
      .populate("items.menuItem", "name price image preparationTime");

    if (!order) return res.status(404).json({ success: false, message: "Order not found." });

    // Live ETA recalculation for tracking view
    const maxPrepTime = Math.max(...order.items.map((i) => i.menuItem?.preparationTime || 15));
    const { totalMinutes, activeOrders } = await computeETA(order.restaurant._id, maxPrepTime);

    return res.status(200).json({
      success: true,
      data: order,
      meta: { etaMinutes: totalMinutes, activeOrdersAhead: activeOrders },
    });
  } catch (err) {
    return next(err);
  }
};

// ─── Cancel Order ────────────────────────────────────────────────────────────

/**
 * PATCH /api/orders/:orderId/cancel
 * Only allowed while status is "pending".
 */
export const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: "Order not found." });

    if (order.status !== "pending") {
      return res.status(400).json({ success: false, message: `Cannot cancel an order that is already "${order.status}".` });
    }

    order.status = "cancelled";
    await order.save();

    return res.status(200).json({ success: true, data: order });
  } catch (err) {
    return next(err);
  }
};
