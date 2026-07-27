import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    serviceName: { type: String, required: true },
planName: { type: String, required: true },
price: { type: Number, required: true },
billingText: { type: String, default: "Starting price" },
features: [{ type: String }],
imageUrl: { type: String, required: true },
imageKey: { type: String, required: true },
highlighted: { type: Boolean, default: false },
active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Pricing", schema);
