// ============================================================
// constants/index.js — single source of truth for shared enums.
// Import these instead of retyping the raw strings, so a typo
// or a future rename only has to happen in one place.
// ============================================================

export const MESSAGE_TYPES = Object.freeze({
  TEXT: "text",
  IMAGE: "image",
  FILE: "file",
});

export const MESSAGE_STATUS = Object.freeze({
  SENT: "sent",
  DELIVERED: "delivered",
  READ: "read",
});

// Ranking used to make sure a message's status only ever moves
// forward (sent → delivered → read), never backwards.
export const MESSAGE_STATUS_RANK = Object.freeze({
  [MESSAGE_STATUS.SENT]: 0,
  [MESSAGE_STATUS.DELIVERED]: 1,
  [MESSAGE_STATUS.READ]: 2,
});

// Socket.IO event names — used by both the server handlers and
// (conceptually) mirrored on the client, kept here so the server
// side never has a stray typo'd event string.
export const SOCKET_EVENTS = Object.freeze({
  ONLINE_USERS: "onlineUsers",
  JOIN_CONVERSATION: "joinConversation",
  LEAVE_CONVERSATION: "leaveConversation",
  TYPING_START: "typingStart",
  TYPING_STOP: "typingStop",
  NEW_MESSAGE: "newMessage",
  NEW_CONVERSATION: "newConversation",
  MESSAGE_STATUS_UPDATED: "messageStatusUpdated",
  MESSAGES_READ: "messagesRead",
  MESSAGE_DELETED: "messageDeleted",
  MESSAGE_REACTION: "messageReaction",
  IN_APP_NOTIFICATION: "inAppNotification",
});

export const LIMITS = Object.freeze({
  MAX_MESSAGE_LENGTH: 10000,
  MAX_AVATAR_BYTES: 5 * 1024 * 1024, // 5 MB
  MAX_CHAT_FILE_BYTES: 10 * 1024 * 1024, // 10 MB
  MAX_USERNAME_LENGTH: 30,
  MAX_BIO_LENGTH: 200,
});

// Matches a Mongo ObjectId — used to reject bad :id params before
// they reach mongoose and blow up with an ugly 500 CastError.
export const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;
