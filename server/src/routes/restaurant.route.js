import { Router } from "express";
import {
  createRestaurant,
  getAllRestaurants,
  getSingleRestaurant,
  updateRestaurant,
  deleteRestaurant
} from "../controllers/restaurant.controller.js";
import { getMenuByRestaurant } from "../controllers/menu.controller.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = Router();

router
  .route("/")
  .get(getAllRestaurants)
  .post(protect, authorizeRoles("admin", "owner"), createRestaurant);

// Public menu endpoint — no auth required
router.get("/:id/menu", getMenuByRestaurant);

router
  .route("/:id")
  .get(getSingleRestaurant)
  .put(protect, updateRestaurant)
  .delete(protect, authorizeRoles("admin"), deleteRestaurant);

export default router;

