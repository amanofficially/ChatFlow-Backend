// ============================================================
// socket/broadcast.js
//
// The original code repeated this exact pattern in ~5 places
// (new message, read receipts, deletes, reactions, typing):
//
//   io.to(conversationId).emit(event, payload)
//   for each participant:
//     if they're online AND not currently inside the room:
//       emit directly to their socket too
//
// That's needed because a participant might have the app open on
// a different screen (not "inside" this conversation's room), so
// the room broadcast alone would miss them — e.g. so their sidebar
// still updates in real time. Centralizing it here means that
// logic is now correct in exactly one place instead of four.
// ============================================================
import { getSocketId } from "./presence.js";

/**
 * Emit an event to everyone in a conversation's room, AND directly
 * to any online participant who isn't currently joined to that room.
 *
 * @param {import('socket.io').Server} io
 * @param {string} conversationId
 * @param {string[]} participantIds  all participant ids (as strings)
 * @param {string} event
 * @param {object} payload
 * @param {string} [excludeUserId]  optional userId to skip entirely (e.g. the sender)
 * @param {string} [excludeSocketId]  optional socket.id to skip in the room broadcast (e.g. the emitting socket itself)
 */
export function broadcastToConversation(
  io,
  conversationId,
  participantIds,
  event,
  payload,
  excludeUserId = null,
  excludeSocketId = null,
) {
  if (excludeSocketId) {
    io.to(conversationId).except(excludeSocketId).emit(event, payload);
  } else {
    io.to(conversationId).emit(event, payload);
  }

  for (const participantId of participantIds) {
    if (excludeUserId && participantId === excludeUserId) continue;

    const socketId = getSocketId(participantId);
    if (!socketId) continue;

    const socket = io.sockets.sockets.get(socketId);
    if (socket && !socket.rooms.has(conversationId)) {
      socket.emit(event, payload);
    }
  }
}

/** Emit directly to a single user's socket, if they're online. Returns true if delivered. */
export function emitToUser(io, userId, event, payload) {
  const socketId = getSocketId(userId);
  if (!socketId) return false;
  const socket = io.sockets.sockets.get(socketId);
  if (!socket) return false;
  socket.emit(event, payload);
  return true;
}
