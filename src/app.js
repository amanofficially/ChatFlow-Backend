// ============================================================
// app.js — builds and configures the Express app.
// Deliberately does NOT call app.listen(); that's server.js's job.
// Keeping the two separate makes the app importable in tests
// without opening a real port.
// ============================================================
import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";

import { env } from "./config/env.js";
import { corsOptions } from "./config/cors.js";
import apiRoutes from "./routes/index.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  // ── Security headers ────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"], // Vite inlines scripts in dev
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "wss:", "ws:"],
          fontSrc: ["'self'", "https:"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: env.isProduction ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use(cors(corsOptions));

  // Explicitly answer every CORS preflight before rate limiting runs.
  // Otherwise a rate limiter can 405 an OPTIONS request, which the
  // browser then reports as a CORS failure on the real request.
  app.options("*", cors(corsOptions));

  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ extended: true, limit: "20mb" }));

  // Needed for express-rate-limit to see the real client IP behind a
  // reverse proxy (nginx / Render / Railway).
  app.set("trust proxy", 1);

  app.use("/api", apiRoutes);

  if (env.isProduction) {
    serveClientBuild(app);
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

/** Serve the built React client and fall back to its index.html for client-side routing. */
function serveClientBuild(app) {
  const clientDist = path.join(__dirname, "../../client/dist");
  app.use(express.static(clientDist, { maxAge: "1d" }));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(clientDist, "index.html"));
  });
}
