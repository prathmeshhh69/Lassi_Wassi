import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getBookingSlots,
  createBooking,
  getMyBookings,
  cancelMyBooking,
} from "../controllers/customer.booking.controller.js";

const router = Router();

// Slot availability is public
router.get("/slots/:restaurantId", getBookingSlots);

// Requires login
router.post("/",                       protect, createBooking);
router.get("/me",                      protect, getMyBookings);
router.patch("/:bookingId/cancel",     protect, cancelMyBooking);

export default router;
