import mongoose from "mongoose";

const pricingSchema =
  new mongoose.Schema(
    {
      serviceName: {
        type: String,
        required: [
          true,
          "Service name is required.",
        ],
        trim: true,
        maxlength: 120,
      },

      /*
       * इसे service के categorySlug
       * के समान रखना है।
       *
       * Example:
       * website-development
       */
      serviceCategorySlug: {
        type: String,
        default: "",
        trim: true,
        lowercase: true,
        maxlength: 140,
      },

      planName: {
        type: String,
        required: [
          true,
          "Plan name is required.",
        ],
        trim: true,
        maxlength: 120,
      },

      price: {
        type: Number,
        required: [
          true,
          "Price is required.",
        ],
        min: [
          0,
          "Price cannot be negative.",
        ],
      },

      billingText: {
        type: String,
        default: "Starting price",
        trim: true,
        maxlength: 200,
      },

      features: [
        {
          type: String,
          trim: true,
        },
      ],

      imageUrl: {
        type: String,
        default: "",
        trim: true,
      },

      imageKey: {
        type: String,
        default: "",
        trim: true,
      },

      highlighted: {
        type: Boolean,
        default: false,
      },

      active: {
        type: Boolean,
        default: true,
      },

      order: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    {
      timestamps: true,
    }
  );

export default mongoose.model(
  "Pricing",
  pricingSchema
);