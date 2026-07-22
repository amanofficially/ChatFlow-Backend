// ============================================================
// controllers/message.controller.js
// ============================================================
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import { ApiError } from "../utils/ApiError.js";
import { getIO } from "../socket/ioRegistry.js";
import { getSocketId, isUserOnline } from "../socket/presence.js";
import { broadcastToConversation, emitToUser } from "../socket/broadcast.js";
import { sanitizeFileName } from "../utils/validators.js";
import {
  MESSAGE_TYPES,
  MESSAGE_STATUS,
  SOCKET_EVENTS,
  LIMITS,
  OBJECT_ID_REGEX,
} from "../constants/index.js";

const SENDER_FIELDS = "username email avatar";

/** Preview text shown in the in-app notification toast for non-text messages. */
function notificationPreview({ type, content, fileName }) {
  if (type === MESSAGE_TYPES.IMAGE) return "📷 Image";
  if (type === MESSAGE_TYPES.FILE) return fileName ? `📎 ${fileName}` : "📎 File";
  return content;
}

/** Load a conversation, throwing 403 if the current user isn't a participant. */
async function requireParticipantConversation(conversationId, userId) {
  const conversation = await Conversation.findOne({ _id: conversationId, participants: userId });
  if (!conversation) throw new ApiError(403, "Access denied");
  return conversation;
}

/** GET /api/messages/:conversationId */
export async function listMessages(req, res) {
  const { conversationId } = req.params;
  if (!OBJECT_ID_REGEX.test(conversationId)) {
    throw new ApiError(400, "Invalid conversation ID");
  }

  const conversation = await requireParticipantConversation(conversationId, req.user._id);

  // If this user previously "deleted" the conversation, only show messages
  // sent after that point — earlier history stays hidden for them.
  const deletedAt = conversation.deletedAt?.get(req.user._id.toString());
  const filter = deletedAt ? { conversationId, createdAt: { $gt: deletedAt } } : { conversationId };

  const messages = await Message.find(filter).populate("sender", SENDER_FIELDS).sort({ createdAt: 1 });
  res.json({ messages });
}

/** POST /api/messages — send a message and notify the other participant(s) in real time. */
export async function sendMessage(req, res) {
  const { conversationId, content, type = MESSAGE_TYPES.TEXT, fileName = null } = req.body;

  if (!conversationId || !content) {
    throw new ApiError(400, "conversationId and content required");
  }
  if (!Object.values(MESSAGE_TYPES).includes(type)) {
    throw new ApiError(400, "Invalid message type");
  }
  if (typeof content !== "string" || content.length > LIMITS.MAX_MESSAGE_LENGTH) {
    throw new ApiError(400, `Message content too long (max ${LIMITS.MAX_MESSAGE_LENGTH} chars)`);
  }

  const conversation = await requireParticipantConversation(conversationId, req.user._id);
  const userId = req.user._id.toString();
  const otherParticipantIds = conversation.participants
    .map((id) => id.toString())
    .filter((id) => id !== userId);

  const anyRecipientOnline = otherParticipantIds.some(isUserOnline);
  const initialStatus = anyRecipientOnline ? MESSAGE_STATUS.DELIVERED : MESSAGE_STATUS.SENT;

  const message = await Message.create({
    conversationId,
    sender: req.user._id,
    content,
    type,
    fileName: type === MESSAGE_TYPES.FILE ? sanitizeFileName(fileName) : null,
    status: initialStatus,
  });
  const populatedMessage = await message.populate("sender", SENDER_FIELDS);

  // Bump unread counters for everyone else, and restore the conversation
  // for anyone who'd previously deleted it (a new message "un-deletes" it for them).
  const unreadIncrements = {};
  otherParticipantIds.forEach((id) => {
    unreadIncrements[`unreadCount.${id}`] = 1;
  });
  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: populatedMessage._id,
    $inc: unreadIncrements,
    $pull: { deletedFor: { $in: otherParticipantIds } },
    updatedAt: new Date(),
  });

  const io = getIO();
  const payload = { message: populatedMessage, conversationId };

  // Broadcast to the room, excluding the sender (they already have it optimistically).
  broadcastToConversation(io, conversationId, otherParticipantIds, SOCKET_EVENTS.NEW_MESSAGE, payload);

  // Anyone online but not currently viewing this conversation also gets a toast notification.
  for (const participantId of otherParticipantIds) {
    const socketId = getSocketId(participantId);
    if (!socketId) continue;
    const socket = io.sockets.sockets.get(socketId);
    if (socket && !socket.rooms.has(conversationId)) {
      socket.emit(SOCKET_EVENTS.IN_APP_NOTIFICATION, {
        conversationId,
        senderName: populatedMessage.sender.username,
        senderAvatar: populatedMessage.sender.avatar,
        content: notificationPreview({ type, content, fileName }),
        messageId: populatedMessage._id,
      });
    }
  }

  // Let the sender know their message was delivered (if anyone was online to receive it).
  if (anyRecipientOnline) {
    emitToUser(io, userId, SOCKET_EVENTS.MESSAGE_STATUS_UPDATED, {
      messageId: populatedMessage._id,
      status: MESSAGE_STATUS.DELIVERED,
    });
  }

  res.status(201).json({ message: populatedMessage });
}

/** PUT /api/messages/:conversationId/read — mark all unread-by-me messages in this conversation as read. */
export async function markMessagesRead(req, res) {
  const { conversationId } = req.params;
  const userId = req.user._id.toString();

  const unreadMessages = await Message.find({
    conversationId,
    sender: { $ne: req.user._id },
    status: { $ne: MESSAGE_STATUS.READ },
  }).select("_id sender");

  if (unreadMessages.length === 0) {
    return res.json({ success: true });
  }

  await Message.updateMany(
    { conversationId, sender: { $ne: req.user._id }, status: { $ne: MESSAGE_STATUS.READ } },
    { $set: { status: MESSAGE_STATUS.READ } },
  );

  const io = getIO();
  const senderIds = [...new Set(unreadMessages.map((m) => m.sender.toString()))];

  for (const senderId of senderIds) {
    const senderSocketId = getSocketId(senderId);
    const senderSocket = senderSocketId ? io.sockets.sockets.get(senderSocketId) : null;
    const senderNotInRoom = senderSocket && !senderSocket.rooms.has(conversationId);

    unreadMessages
      .filter((m) => m.sender.toString() === senderId)
      .forEach((m) => {
        io.to(conversationId).emit(SOCKET_EVENTS.MESSAGE_STATUS_UPDATED, {
          messageId: m._id,
          status: MESSAGE_STATUS.READ,
        });
        if (senderNotInRoom) {
          senderSocket.emit(SOCKET_EVENTS.MESSAGE_STATUS_UPDATED, { messageId: m._id, status: MESSAGE_STATUS.READ });
        }
      });

    io.to(conversationId).emit(SOCKET_EVENTS.MESSAGES_READ, { conversationId, readBy: userId });
    if (senderNotInRoom) {
      senderSocket.emit(SOCKET_EVENTS.MESSAGES_READ, { conversationId, readBy: userId });
    }
  }

  res.json({ success: true });
}

/** DELETE /api/messages/:id */
export async function deleteMessage(req, res) {
  const message = await Message.findById(req.params.id);
  if (!message) throw new ApiError(404, "Message not found");
  if (message.sender.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  const conversationId = message.conversationId.toString();
  await message.deleteOne();

  const conversation = await Conversation.findById(conversationId);
  const participantIds = conversation?.participants.map((id) => id.toString()) ?? [];

  broadcastToConversation(
    getIO(),
    conversationId,
    participantIds,
    SOCKET_EVENTS.MESSAGE_DELETED,
    { messageId: req.params.id, conversationId },
  );

  res.json({ success: true });
}

/** POST /api/messages/:id/react — body: { emoji: "❤️" | null } */
export async function reactToMessage(req, res) {
  const { emoji } = req.body;
  const message = await Message.findById(req.params.id);
  if (!message) throw new ApiError(404, "Message not found");

  const userId = req.user._id.toString();
  if (emoji) {
    message.reactions.set(userId, emoji);
  } else {
    message.reactions.delete(userId);
  }
  await message.save();

  const conversationId = message.conversationId.toString();
  const conversation = await Conversation.findById(conversationId);
  const participantIds = conversation?.participants.map((id) => id.toString()) ?? [];

  broadcastToConversation(
    getIO(),
    conversationId,
    participantIds,
    SOCKET_EVENTS.MESSAGE_REACTION,
    { messageId: req.params.id, userId, emoji: emoji || null },
  );

  res.json({ success: true });
}
