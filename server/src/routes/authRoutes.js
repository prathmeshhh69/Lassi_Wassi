import { Router } from "express";
import {
  registerUser,
  loginUser,
  ownerLogin,
  getMe
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/owner-login", ownerLogin);
router.get("/me", protect, getMe);

export default router;

