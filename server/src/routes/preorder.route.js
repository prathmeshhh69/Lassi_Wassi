import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getAvailableSlots,
  createPreOrder,
  getMyPreOrders,
  cancelPreOrder,
} from "../controllers/preorder.controller.js";

const router = Router();

// Slot availability is public (no login required to browse)
router.get("/slots/:restaurantId", getAvailableSlots);

// These require login
router.post("/",                    protect, createPreOrder);
router.get("/me",                   protect, getMyPreOrders);
router.patch("/:orderId/cancel",    protect, cancelPreOrder);

export default router;
