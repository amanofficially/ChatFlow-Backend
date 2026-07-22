// ============================================================
// routes/index.js — mounts every feature router under /api/*.
// Kept separate from app.js so app.js stays focused on
// Express-level wiring (middleware, static files, error handling).
// ============================================================
import { Router } from "express";
import { authLimiter, apiLimiter } from "../middleware/rateLimiters.js";

import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import conversationRoutes from "./conversation.routes.js";
import messageRoutes from "./message.routes.js";
import uploadRoutes from "./upload.routes.js";

const router = Router();

router.use("/auth", authLimiter, authRoutes);
router.use("/users", apiLimiter, userRoutes);
router.use("/conversations", apiLimiter, conversationRoutes);
router.use("/messages", apiLimiter, messageRoutes);
router.use("/upload", apiLimiter, uploadRoutes);

router.get("/health", (_req, res) => res.json({ status: "ok", uptime: process.uptime() }));

export default router;
