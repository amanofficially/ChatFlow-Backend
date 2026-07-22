// ============================================================
// socket/presence.js — tracks which users are currently online
// and which socket connection belongs to them.
//
// This is the single source of truth for "is user X online?"
// so controllers (e.g. deciding whether a new message starts as
// "sent" or "delivered") and socket handlers both read from the
// same map instead of keeping their own copies.
// ============================================================

/** userId (string) -> socket.id (string) */
const onlineUsers = new Map();

export function setUserOnline(userId, socketId) {
  onlineUsers.set(userId, socketId);
}

export function setUserOffline(userId) {
  onlineUsers.delete(userId);
}

/** Returns the live socket.id for a user, or undefined if they're offline. */
export function getSocketId(userId) {
  return onlineUsers.get(userId);
}

export function isUserOnline(userId) {
  return onlineUsers.has(userId);
}

export function getOnlineUserIds() {
  return Array.from(onlineUsers.keys());
}
