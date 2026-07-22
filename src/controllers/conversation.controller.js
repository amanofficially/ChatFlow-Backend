// ============================================================
// controllers/conversation.controller.js
// ============================================================
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { ApiError } from "../utils/ApiError.js";
import { getIO } from "../socket/ioRegistry.js";
import { emitToUser } from "../socket/broadcast.js";
import { SOCKET_EVENTS } from "../constants/index.js";

const LAST_MESSAGE_POPULATE = { path: "lastMessage", populate: { path: "sender", select: "username" } };

const findConversationById = (id) =>
  Conversation.findById(id).populate("participants", "-password").populate(LAST_MESSAGE_POPULATE);

/** Attach the requesting user's personal unread count onto a conversation document. */
const withUnreadCountFor = (conversation, userId) => ({
  ...conversation.toObject(),
  unreadCount: conversation.unreadCount?.get(userId) || 0,
});

/** GET /api/conversations */
export async function listConversations(req, res) {
  const userId = req.user._id.toString();

  const conversations = await Conversation.find({
    participants: req.user._id,
    deletedFor: { $ne: req.user._id }, // hidden if this user deleted it
  })
    .populate("participants", "-password")
    .populate(LAST_MESSAGE_POPULATE)
    .sort({ updatedAt: -1 });

  res.json({ conversations: conversations.map((c) => withUnreadCountFor(c, userId)) });
}

/** POST /api/conversations — create or return the existing one-on-one conversation. */
export async function createConversation(req, res) {
  const { participantId } = req.body;
  const userId = req.user._id.toString();

  if (!participantId) throw new ApiError(400, "participantId required");
  if (participantId === userId) throw new ApiError(400, "Cannot create conversation with yourself");

  let conversation = await Conversation.findOne({
    participants: { $all: [req.user._id, participantId], $size: 2 },
  })
    .populate("participants", "-password")
    .populate(LAST_MESSAGE_POPULATE);

  const isNewConversation = !conversation;

  if (!conversation) {
    const created = await Conversation.create({ participants: [req.user._id, participantId] });
    conversation = await findConversationById(created._id);
  } else if (conversation.deletedFor?.length > 0) {
    // Restore it if the current user had previously deleted it.
    conversation.deletedFor = conversation.deletedFor.filter((id) => id.toString() !== userId);
    await conversation.save();
    conversation = await findConversationById(conversation._id);
  }

  // Let the other participant know a new conversation was started with them.
  if (isNewConversation) {
    emitToUser(getIO(), participantId, SOCKET_EVENTS.NEW_CONVERSATION, {
      conversation: withUnreadCountFor(conversation, participantId),
    });
  }

  res.json({ conversation: withUnreadCountFor(conversation, userId) });
}

/** DELETE /api/conversations/:id — remove the conversation for the current user only. */
export async function deleteConversation(req, res) {
  const userId = req.user._id.toString();

  const conversation = await Conversation.findOne({
    _id: req.params.id,
    participants: req.user._id,
    deletedFor: { $ne: req.user._id },
  });
  if (!conversation) throw new ApiError(404, "Conversation not found");

  conversation.deletedFor.push(req.user._id);
  conversation.deletedAt.set(userId, new Date());

  const everyoneDeleted = conversation.participants.every((participantId) =>
    conversation.deletedFor.some((deletedId) => deletedId.toString() === participantId.toString()),
  );

  if (everyoneDeleted) {
    await Message.deleteMany({ conversationId: conversation._id });
    await Conversation.findByIdAndDelete(conversation._id);
  } else {
    await conversation.save();
  }

  res.json({ success: true });
}

/** PUT /api/conversations/:id/read — zero out the unread badge for the current user. */
export async function markConversationRead(req, res) {
  const conversation = await Conversation.findOne({
    _id: req.params.id,
    participants: req.user._id,
  });
  if (!conversation) throw new ApiError(404, "Conversation not found");

  conversation.unreadCount.set(req.user._id.toString(), 0);
  await conversation.save();

  res.json({ success: true });
}
