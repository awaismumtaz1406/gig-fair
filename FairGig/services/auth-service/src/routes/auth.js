import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();
const roles = new Set(["worker", "verifier", "advocate"]);
const cities = new Set(["Lahore", "Karachi", "Islamabad"]);
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const getCookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000
});

const buildToken = (user) =>
  jwt.sign(
    { userId: user._id.toString(), role: user.role, city: user.city, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { name, email, password, role, city } = req.body;
    if (!name || !email || !password || !role || !city) {
      return res.status(400).json({ data: null, error: "Validation failed", message: "All fields are required" });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ data: null, error: "Validation failed", message: "Invalid email format" });
    }
    if (password.length < 8 || !roles.has(role) || !cities.has(city)) {
      return res.status(400).json({ data: null, error: "Validation failed", message: "Invalid role, city, or password" });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ data: null, error: "Conflict", message: "Email already registered" });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: email.toLowerCase(), password: hashed, role, city });
    const token = buildToken(user);
    res.cookie("token", token, getCookieOptions());
    return res.status(201).json({
      data: { user: { id: user._id.toString(), name: user.name, role: user.role, city: user.city } },
      error: null,
      message: "Registered successfully"
    });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email || "").toLowerCase() });
    if (!user) {
      return res.status(401).json({ data: null, error: "Unauthorized", message: "Invalid credentials" });
    }
    const ok = await bcrypt.compare(password || "", user.password);
    if (!ok) {
      return res.status(401).json({ data: null, error: "Unauthorized", message: "Invalid credentials" });
    }
    const token = buildToken(user);
    res.cookie("token", token, getCookieOptions());
    return res.json({
      data: { user: { id: user._id.toString(), name: user.name, role: user.role, city: user.city } },
      error: null,
      message: "Login successful"
    });
  })
);

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ data: null, error: null, message: "Logged out" });
});

router.get(
  "/me",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.userId).select("_id name role city");
    if (!user) {
      return res.status(404).json({ data: null, error: "Not found", message: "User not found" });
    }
    return res.json({
      data: { user: { id: user._id.toString(), name: user.name, role: user.role, city: user.city } },
      error: null,
      message: "User profile"
    });
  })
);

export default router;
