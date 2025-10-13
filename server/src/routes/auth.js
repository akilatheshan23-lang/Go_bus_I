import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import User from "../models/User.js";

const router = express.Router();

function signAndSetCookie(res, user) {
  const token = jwt.sign(
    { id: user._id, username: user.username, role: user.role, name: user.name },
    process.env.JWT_SECRET || "devsecret",
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
  res.cookie("token", token, { httpOnly: true, sameSite: "lax", secure: false, maxAge: 7*24*3600*1000 });
}

router.post("/register",
  body("username").isLength({ min: 3 }).trim(),
  body("password").isStrongPassword({ minLength: 8, minLowercase:1, minUppercase:1, minNumbers:1, minSymbols:1 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { name, username, password } = req.body;
    const existing = await User.findOne({ username });
    if (existing) return res.status(409).json({ error: "Username already taken" });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, username, passwordHash, role: "user" });
    signAndSetCookie(res, user);
    res.json({ message: "Registered", user: { id: user._id, username: user.username, role: user.role, name: user.name } });
  }
);

router.post("/login",
  body("username").exists(),
  body("password").exists(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    signAndSetCookie(res, user);
    res.json({ message: "Logged in", user: { id: user._id, username: user.username, role: user.role, name: user.name } });
  }
);

router.post("/logout", (req, res) => { res.clearCookie("token"); res.json({ message: "Logged out" }); });
router.get("/me", (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.json({ user: null });
    const payload = jwt.verify(token, process.env.JWT_SECRET || "devsecret");
    res.json({ user: payload });
  } catch { res.json({ user: null }); }
});

export default router;
