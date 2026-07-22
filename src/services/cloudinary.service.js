import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a user avatar — square-cropped, face-aware, stored in chatflow/avatars.
 * @param {string} base64DataUri
 * @param {object} [options] extra cloudinary options (public_id, overwrite, etc.)
 * @returns {Promise<string>} secure_url
 */
export async function uploadAvatar(base64DataUri, options = {}) {
  const result = await cloudinary.uploader.upload(base64DataUri, {
    folder: "chatflow/avatars",
    resource_type: "image",
    transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
    ...options,
  });
  return result.secure_url;
}

/**
 * Upload an image shared inside a chat conversation.
 * @param {string} base64DataUri
 * @param {string} userId
 * @returns {Promise<string>} secure_url
 */
export async function uploadChatImage(base64DataUri, userId) {
  const result = await cloudinary.uploader.upload(base64DataUri, {
    folder: `chatflow/chat/images/${userId}`,
    resource_type: "image",
  });
  return result.secure_url;
}

/**
 * Upload a non-image file (PDF, DOC, ZIP, etc.) shared inside a chat.
 * resource_type "auto" lets Cloudinary detect the correct type.
 * @param {string} base64DataUri
 * @param {string} userId
 * @returns {Promise<string>} secure_url
 */
export async function uploadChatFile(base64DataUri, userId) {
  const result = await cloudinary.uploader.upload(base64DataUri, {
    folder: `chatflow/chat/files/${userId}`,
    resource_type: "auto",
  });
  return result.secure_url;
}
