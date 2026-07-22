// ============================================================
// controllers/user.controller.js
// ============================================================
import User from "../models/User.js";
import { escapeRegex } from "../utils/validators.js";

/** GET /api/users/search?q=username */
export async function searchUsers(req, res) {
  const query = (req.query.q || "").trim();
  if (!query) {
    return res.json({ users: [] });
  }

  const pattern = escapeRegex(query);

  const users = await User.find({
    _id: { $ne: req.user._id },
    $or: [
      { username: { $regex: pattern, $options: "i" } },
      { email: { $regex: pattern, $options: "i" } },
      { mobile: { $regex: pattern, $options: "i" } },
    ],
  })
    .limit(10)
    .select("-password");

  res.json({ users });
}
