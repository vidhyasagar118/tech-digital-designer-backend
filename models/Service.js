import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true },
shortDescription: { type: String, required: true },
description: { type: String, default: "" },
imageUrl: { type: String, required: true },
imageKey: { type: String, required: true },
active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Service", schema);
