import User from "../models/User.model.js";
import { generateToken } from "../utils/jwt.js";

// Response payload is sanitized by the model's toJSON/toObject transforms

export const registerUser = async (req, res, next) => {
  try {
    console.log("Hit POST /api/auth/register");
    console.log("Request body:", req.body);

    // Never accept role from the client — customers can only self-register
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, password and phone"
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists"
      });
    }

    // Role is always "customer" — owner accounts are created via seedOwner.js
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: "customer"
    });

    const token = generateToken(user._id, user.role);

    return res.status(201).json({
      success: true,
      data: user,
      token
    });
  } catch (error) {
    return next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password"
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      data: user,
      token
    });
  } catch (error) {
    return next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized"
      });
    }

    return res.status(200).json({
      success: true,
      data: req.user
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/auth/owner-login
 * Dedicated login for restaurant owners only.
 * Returns 403 if the account is not an "owner" role.
 */
export const ownerLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password"
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    if (!["owner", "admin"].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: this login is for restaurant owners and admins only"
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      data: user,
      token
    });
  } catch (error) {
    return next(error);
  }
};

