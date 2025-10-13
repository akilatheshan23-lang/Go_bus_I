import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  username: { type: String, unique: true, required: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
}, { timestamps: true });

export default mongoose.model("User", UserSchema);
