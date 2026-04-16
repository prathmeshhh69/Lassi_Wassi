import { Router } from "express";
import { getHealth } from "../controllers/health.controller.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/health", getHealth);

router.get("/test", protect, (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Protected route working",
    user: req.user
  });
});

export default router;

 