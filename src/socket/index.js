// ============================================================
// socket/index.js — wires up Socket.IO: auth, then per-connection handlers.
// ============================================================
import { authenticateSocket } from "./authenticateSocket.js";
import { registerConnectionHandlers } from "./handlers/connection.handler.js";
import { registerTypingHandlers } from "./handlers/typing.handler.js";

export function setupSocket(io) {
  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    registerConnectionHandlers(io, socket);
    registerTypingHandlers(io, socket);
  });
}
