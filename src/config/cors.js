// ============================================================
// config/cors.js — one CORS policy shared by both Express and
// Socket.IO, so the two never drift apart.
// ============================================================
import { env } from "./env.js";

const DEV_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:4173",
  "http://localhost:5173",
];

const allowedOrigins = [
  ...env.CLIENT_URL.split(",").map((origin) => origin.trim()),
  ...DEV_ORIGINS,
];

export const corsOptions = {
  origin(origin, callback) {
    // Allow server-to-server calls (no Origin header) or whitelisted origins.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
};
