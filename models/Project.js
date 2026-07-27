import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true },
category: { type: String, required: true },
shortDescription: { type: String, required: true },
description: { type: String, default: "" },
liveUrl: { type: String, default: "" },
imageUrl: { type: String, required: true },
imageKey: { type: String, required: true },
featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Project", schema);
