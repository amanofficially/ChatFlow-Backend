// ============================================================
// socket/ioRegistry.js
//
// The old code had controllers `import { io } from "../index.js"`
// while index.js imported those same controllers — a circular
// dependency that happened to work with ESM's live bindings, but
// is fragile and confusing to trace.
//
// Instead: server.js creates the Socket.IO server and registers
// it here once at boot. Everything else (controllers, socket
// handlers) reads it back through getIO(), with no circular import.
// ============================================================
let ioInstance = null;

export function registerIO(io) {
  ioInstance = io;
}

export function getIO() {
  if (!ioInstance) {
    throw new Error("Socket.IO server accessed before it was initialized.");
  }
  return ioInstance;
}
