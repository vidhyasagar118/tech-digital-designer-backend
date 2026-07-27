import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true },
subtitle: { type: String, default: "" },
buttonText: { type: String, default: "Contact Us" },
buttonLink: { type: String, default: "/contact" },
imageUrl: { type: String, required: true },
imageKey: { type: String, required: true },
order: { type: Number, default: 0 },
active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Slider", schema);
