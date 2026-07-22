// ============================================================
// controllers/upload.controller.js — avatar & chat media uploads.
// ============================================================
import User from "../models/User.js";
import { uploadAvatar, uploadChatImage, uploadChatFile } from "../services/cloudinary.service.js";
import { ApiError } from "../utils/ApiError.js";
import { LIMITS } from "../constants/index.js";

/** A base64 data URI is ~1.37x the size of the decoded binary. */
const base64ByteSize = (base64String) => (base64String.length * 3) / 4;

/** POST /api/upload/avatar — body: { image: "<base64 data URI>" } */
export async function uploadAvatarImage(req, res) {
  const { image } = req.body;

  if (!image) throw new ApiError(400, "No image provided");
  if (typeof image !== "string" || !image.startsWith("data:image/")) {
    throw new ApiError(400, "Send a base64 image data URI.");
  }
  if (base64ByteSize(image) > LIMITS.MAX_AVATAR_BYTES) {
    throw new ApiError(400, "Image too large (max 5 MB)");
  }

  const url = await uploadAvatar(image, {
    public_id: `user_${req.user._id}`,
    overwrite: true,
    invalidate: true,
  });

  await User.findByIdAndUpdate(req.user._id, { avatar: url });
  res.json({ url });
}

/**
 * POST /api/upload/chat-media
 * body: { file: "<base64 data URI>", name: "report.pdf", mimeType: "application/pdf" }
 */
export async function uploadChatMedia(req, res) {
  const { file, name, mimeType } = req.body;

  if (!file || !name || !mimeType) {
    throw new ApiError(400, "file, name and mimeType are required.");
  }
  if (typeof file !== "string" || !file.startsWith("data:")) {
    throw new ApiError(400, "Send a base64 data URI.");
  }
  if (base64ByteSize(file) > LIMITS.MAX_CHAT_FILE_BYTES) {
    throw new ApiError(400, "File too large (max 10 MB).");
  }

  const userId = req.user._id.toString();
  const isImage = mimeType.startsWith("image/");
  const url = isImage ? await uploadChatImage(file, userId) : await uploadChatFile(file, userId);

  res.json({ url, type: isImage ? "image" : "file", originalName: name });
}
