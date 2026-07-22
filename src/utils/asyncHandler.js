// ============================================================
// utils/asyncHandler.js
//
// Every route in the old codebase repeated the same
// `try { ... } catch (err) { res.status(500).json(...) }` block.
// Wrapping a controller in asyncHandler removes that duplication:
// any rejected promise is forwarded to Express's error middleware
// instead of needing its own try/catch.
//
// Usage:
//   router.get("/", asyncHandler(async (req, res) => { ... }))
// ============================================================
export const asyncHandler = (controller) => (req, res, next) =>
  Promise.resolve(controller(req, res, next)).catch(next);
