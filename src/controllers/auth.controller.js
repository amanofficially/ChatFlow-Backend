// ============================================================
// controllers/auth.controller.js — signup, login, current user, profile update.
// ============================================================
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { LIMITS } from "../constants/index.js";
import { sanitizeStr, isValidEmail, isStrongPassword } from "../utils/validators.js";

const signToken = (userId) =>
  jwt.sign({ id: userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN, algorithm: "HS256" });

export async function signup(req, res) {
  const username = sanitizeStr(req.body.username, LIMITS.MAX_USERNAME_LENGTH);
  const email = sanitizeStr(req.body.email, 100).toLowerCase();
  const password = typeof req.body.password === "string" ? req.body.password : "";
  const mobile = sanitizeStr(req.body.mobile, 20);

  if (!username || !email || !password) {
    throw new ApiError(400, "Username, email and password are required");
  }
  if (username.length < 2) {
    throw new ApiError(400, "Username must be at least 2 characters");
  }
  if (!isValidEmail(email)) {
    throw new ApiError(400, "Invalid email address");
  }
  if (!isStrongPassword(password)) {
    throw new ApiError(400, "Password must be at least 6 characters and include a letter and a digit");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, "Email already registered");
  }

  const user = await User.create({ username, email, password, mobile });
  res.status(201).json({ user, token: signToken(user._id) });
}

export async function login(req, res) {
  const email = sanitizeStr(req.body.email, 100).toLowerCase();
  const password = typeof req.body.password === "string" ? req.body.password : "";

  if (!email || !password) {
    throw new ApiError(400, "Email and password required");
  }

  const user = email && isValidEmail(email) ? await User.findOne({ email }) : null;

  // Same generic message whether the email or the password was wrong,
  // to avoid leaking which accounts exist.
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  res.json({ user, token: signToken(user._id) });
}

export function getCurrentUser(req, res) {
  res.json({ user: req.user });
}

export async function updateProfile(req, res) {
  const { username, email, bio, avatar, mobile } = req.body;
  const updates = {};

  if (username !== undefined) {
    const value = sanitizeStr(username, LIMITS.MAX_USERNAME_LENGTH);
    if (value.length < 2) throw new ApiError(400, "Username must be at least 2 characters");
    updates.username = value;
  }

  if (bio !== undefined) updates.bio = sanitizeStr(bio, LIMITS.MAX_BIO_LENGTH);
  if (mobile !== undefined) updates.mobile = sanitizeStr(mobile, 20);
  if (avatar !== undefined) updates.avatar = typeof avatar === "string" ? avatar.slice(0, 5000) : null;

  if (email !== undefined) {
    const value = sanitizeStr(email, 100).toLowerCase();
    if (!isValidEmail(value)) throw new ApiError(400, "Invalid email address");

    const emailTaken = await User.findOne({ email: value, _id: { $ne: req.user._id } });
    if (emailTaken) throw new ApiError(400, "Email already in use");
    updates.email = value;
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });
  res.json({ user });
}
