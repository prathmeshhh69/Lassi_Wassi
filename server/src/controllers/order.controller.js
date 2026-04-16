import Order from "../models/Order.model.js";
import Restaurant from "../models/Restaurant.model.js";
import { getIO } from "../utils/socket.js";

const VALID_STATUSES = ["pending", "preparing", "out_for_delivery", "completed", "cancelled"];

/** Verify the requesting user owns the restaurant */
const assertOwner = async (userId, restaurantId) => {
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) return { ok: false, status: 404, message: "Restaurant not found" };
  if (restaurant.owner.toString() !== userId.toString())
    return { ok: false, status: 403, message: "Forbidden: you do not own this restaurant" };
  return { ok: true, restaurant };
};

/**
 * GET /api/owner/restaurants/:restaurantId/orders
 * List all orders for a restaurant with optional status filter & pagination.
 */
export const getOrdersByRestaurant = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const { status, page = 1, limit = 20 } = req.query;

    const check = await assertOwner(req.user._id, restaurantId);
    if (!check.ok) return res.status(check.status).json({ success: false, message: check.message });

    const filter = { restaurant: restaurantId };
    if (status && VALID_STATUSES.includes(status)) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("user", "name email phone")
        .populate("items.menuItem", "name price")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      data: orders,
      meta: { total, page: Number(page), limit: Number(limit) }
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * PATCH /api/owner/orders/:orderId/status
 * Update order status. Owner must own the restaurant the order belongs to.
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${VALID_STATUSES.join(", ")}`
      });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const check = await assertOwner(req.user._id, order.restaurant);
    if (!check.ok) return res.status(check.status).json({ success: false, message: check.message });

    order.status = status;
    await order.save();

    // Notify the customer who placed this order
    try {
      getIO().to(`user:${order.user}`).emit("orderStatusUpdated", {
        orderId:    order._id,
        status,
        restaurantId: order.restaurant,
      });
    } catch (_) {}

    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/owner/restaurants/:restaurantId/orders/:orderId
 * Single order detail.
 */
export const getOrderById = async (req, res, next) => {
  try {
    const { restaurantId, orderId } = req.params;

    const check = await assertOwner(req.user._id, restaurantId);
    if (!check.ok) return res.status(check.status).json({ success: false, message: check.message });

    const order = await Order.findOne({ _id: orderId, restaurant: restaurantId })
      .populate("user", "name email phone")
      .populate("items.menuItem", "name price image");

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    return next(error);
  }
};
