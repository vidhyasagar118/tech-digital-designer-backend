import mongoose from "mongoose";

const paymentSettingSchema =
  new mongoose.Schema(
    {
      key: {
        type: String,
        required: true,
        unique: true,
        default: "main-payment",
        trim: true,
      },

      qrImageUrl: {
        type: String,
        default: "",
        trim: true,
      },

      qrImageKey: {
        type: String,
        default: "",
        trim: true,
      },

      upiId: {
        type: String,
        default: "",
        trim: true,
      },

      accountName: {
        type: String,
        default: "",
        trim: true,
      },

      active: {
        type: Boolean,
        default: true,
      },
    },
    {
      timestamps: true,
    }
  );

export default mongoose.model(
  "PaymentSetting",
  paymentSettingSchema
);