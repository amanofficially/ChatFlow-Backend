import "../config/env.js";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import User from "../models/User.js";

async function run() {
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected to MongoDB");

  const result = await User.updateMany(
    { avatar: { $regex: /^data:image\// } },
    { $set: { avatar: null } },
  );

  console.log(`Cleaned ${result.modifiedCount} users with base64 avatars`);
  await mongoose.disconnect();
  console.log("Done");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
