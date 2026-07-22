// ============================================================
// utils/validators.js — small, dependency-free input helpers
// shared by the auth and message controllers.
// ============================================================

/** Trim a string and cap its length. Returns "" for non-strings. */
export const sanitizeStr = (value, maxLength = 200) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

/** Simple RFC-5322-ish email check — good enough for signup/login forms. */
export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/** At least 6 chars, containing one letter and one digit. */
export const isStrongPassword = (password) =>
  typeof password === "string" &&
  password.length >= 6 &&
  /[a-zA-Z]/.test(password) &&
  /\d/.test(password);

/** Escape regex special characters so user search input can't break/ReDoS a $regex query. */
export const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Strip path separators from a filename and cap its length. */
export const sanitizeFileName = (name) =>
  name ? String(name).replace(/[/\\]/g, "").slice(0, 255) : null;
