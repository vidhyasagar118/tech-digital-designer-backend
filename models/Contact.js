import mongoose from "mongoose";

const contactSchema =
  new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
        trim: true,
      },

      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },

      phone: {
        type: String,
        required: true,
        trim: true,
      },

      serviceId: {
        type:
          mongoose.Schema.Types
            .ObjectId,
        ref: "Service",
        default: null,
      },

      service: {
        type: String,
        required: true,
        trim: true,
      },

      serviceImage: {
        type: String,
        default: "",
      },

      budget: {
        type: String,
        default: "",
      },

      message: {
        type: String,
        required: true,
        trim: true,
      },

      whatsappConsent: {
        type: Boolean,
        default: false,
      },

      status: {
        type: String,
        enum: [
          "new",
          "contacted",
          "approved",
          "payment_pending",
          "paid",
          "rejected",
          "closed",
        ],
        default: "new",
      },

      adminMessage: {
        type: String,
        default: "",
      },

      paymentQrUrl: {
        type: String,
        default: "",
      },

      paymentUpiId: {
        type: String,
        default: "",
      },

      paymentAccountName: {
        type: String,
        default: "",
      },

      approvedAt: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

export default mongoose.model(
  "Contact",
  contactSchema
);