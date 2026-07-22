// ============================================================
// middleware/errorHandler.js
//
// Every controller now either throws an ApiError (deliberate,
// e.g. "400 Invalid email") or lets an unexpected error bubble up
// through asyncHandler. Both land here, in exactly one place,
// instead of every route hand-writing `res.status(500).json(...)`.
// ============================================================
import { env } from "../config/env.js";

export function notFoundHandler(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err, req, res, _next) {
  const statusCode = err.isApiError ? err.statusCode : 500;

  if (statusCode === 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, err.message);
  }

  res.status(statusCode).json({
    message: err.isApiError ? err.message : "Server error",
    // Only leak internal error details outside of production, to help debugging.
    ...(!env.isProduction && statusCode === 500 ? { detail: err.message } : {}),
  });
}
