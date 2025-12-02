import mongoose from "mongoose";

const AlertSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    title: String,
    body: String,
    time: String,
    read: { type: Boolean, default: false },
    image: String // base64 screenshot
  },
  { timestamps: true }
);

export default mongoose.model("Alert", AlertSchema);
