// ============================================================
// utils/ApiError.js
//
// Throwing `new ApiError(400, "message")` from inside a
// controller lets the central error handler (see
// middleware/errorHandler.js) turn it into the right HTTP
// status code, instead of every route hand-rolling
// `res.status(x).json({ message })`.
// ============================================================
export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isApiError = true;
  }
}
