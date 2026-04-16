import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
} from "../controllers/customer.order.controller.js";

const router = Router();

// All customer order routes require authentication
router.use(protect);

router.post("/", createOrder);               // POST  /api/orders
router.get("/me", getMyOrders);              // GET   /api/orders/me
router.get("/:orderId", getOrderById);       // GET   /api/orders/:orderId
router.patch("/:orderId/cancel", cancelOrder); // PATCH /api/orders/:orderId/cancel

export default router;
