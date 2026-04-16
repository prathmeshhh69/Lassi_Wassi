import { Router } from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

// Order controllers
import {
  getOrdersByRestaurant,
  updateOrderStatus,
  getOrderById
} from "../controllers/order.controller.js";

// Booking controllers
import {
  getBookings,
  createBooking,
  updateBookingStatus,
  updateBooking,
  deleteBooking
} from "../controllers/booking.controller.js";

// Analytics
import {
  getAnalytics,
  getDailyRevenue,
  getWeeklyRevenue,
  getConversionRate,
} from "../controllers/analytics.controller.js";

// Menu (reuse existing controller)
import {
  createMenuItem,
  getMenuByRestaurant,
  updateMenuItem,
  deleteMenuItem
} from "../controllers/menu.controller.js";

const router = Router();

// Restaurant model for my-restaurant lookup
import Restaurant from "../models/Restaurant.model.js";

// All owner routes require a valid token + owner/admin role
router.use(protect, authorizeRoles("owner", "admin"));

// ── My Restaurant ────────────────────────────────────────────────────────────
router.get("/my-restaurant", async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    return res.json({ success: true, data: restaurant ?? null });
  } catch (err) {
    return next(err);
  }
});

// ── Analytics ────────────────────────────────────────────────────────────────
router.get("/restaurants/:restaurantId/analytics",            getAnalytics);
router.get("/restaurants/:restaurantId/analytics/daily",      getDailyRevenue);
router.get("/restaurants/:restaurantId/analytics/weekly",     getWeeklyRevenue);
router.get("/restaurants/:restaurantId/analytics/conversion", getConversionRate);

// ── Orders ───────────────────────────────────────────────────────────────────
router.get("/restaurants/:restaurantId/orders", getOrdersByRestaurant);
router.get("/restaurants/:restaurantId/orders/:orderId", getOrderById);
router.patch("/orders/:orderId/status", updateOrderStatus);

// ── Menu Items ───────────────────────────────────────────────────────────────
router.get("/restaurants/:restaurantId/menu", getMenuByRestaurant);
router.post("/menu", createMenuItem);
router.put("/menu/:id", updateMenuItem);
router.delete("/menu/:id", deleteMenuItem);

// ── Bookings ─────────────────────────────────────────────────────────────────
router.get("/restaurants/:restaurantId/bookings", getBookings);
router.post("/restaurants/:restaurantId/bookings", createBooking);
router.patch("/bookings/:bookingId/status", updateBookingStatus);
router.put("/bookings/:bookingId", updateBooking);
router.delete("/bookings/:bookingId", deleteBooking);

export default router;
