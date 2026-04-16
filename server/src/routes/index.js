import { Router } from "express";
import healthRoute from "./health.route.js";
import restaurantRoute from "./restaurant.route.js";
import authRoute from "./authRoutes.js";
import ownerRoute from "./owner.route.js";
import orderRoute from "./order.route.js";
import preorderRoute from "./preorder.route.js";
import customerBookingRoute from "./customer.booking.route.js";

const router = Router();

router.use("/api", healthRoute);
router.use("/api/restaurants", restaurantRoute);
router.use("/api/auth", authRoute);
router.use("/api/owner", ownerRoute);
router.use("/api/orders", orderRoute);
router.use("/api/preorders", preorderRoute);
router.use("/api/bookings", customerBookingRoute);

export default router;


