import express from "express";

import PaymentSetting from "../models/PaymentSetting.js";

import {
  adminOnly,
  protect,
} from "../middleware/auth.js";

import {
  upload,
} from "../middleware/upload.js";

import {
  deleteImage,
  uploadImage,
} from "../config/s3.js";

const router = express.Router();

const SETTING_KEY =
  "main-payment";

router.get(
  "/",
  protect,
  adminOnly,
  async (req, res) => {
    try {
      const setting =
        await PaymentSetting.findOne({
          key: SETTING_KEY,
        });

      return res.json(
        setting || {
          key: SETTING_KEY,
          qrImageUrl: "",
          qrImageKey: "",
          accountName: "",
          upiId: "",
          active: true,
        }
      );
    } catch (error) {
      console.error(
        "Payment setting load error:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            error.message ||
            "Payment setting could not be loaded.",
        });
    }
  }
);

router.post(
  "/qr",
  protect,
  adminOnly,
  upload.single("image"),
  async (req, res) => {
    let uploadedImage = null;

    try {
      console.log(
        "Payment QR body:",
        req.body
      );

      console.log(
        "Payment QR file:",
        req.file
          ? {
              name:
                req.file
                  .originalname,
              type:
                req.file.mimetype,
              size:
                req.file.size,
            }
          : null
      );

      if (!req.file) {
        return res
          .status(400)
          .json({
            message:
              'Payment QR image missing. The upload field must be named "image".',
          });
      }

      const oldSetting =
        await PaymentSetting.findOne({
          key: SETTING_KEY,
        });

      uploadedImage =
        await uploadImage(
          req.file,
          "payment-qr"
        );

      if (
        !uploadedImage?.imageUrl ||
        !uploadedImage?.imageKey
      ) {
        throw new Error(
          "S3 upload did not return imageUrl and imageKey."
        );
      }

      const setting =
        await PaymentSetting.findOneAndUpdate(
          {
            key: SETTING_KEY,
          },
          {
            $set: {
              qrImageUrl:
                uploadedImage.imageUrl,

              qrImageKey:
                uploadedImage.imageKey,

              accountName:
                String(
                  req.body
                    .accountName ||
                    ""
                ).trim(),

              upiId:
                String(
                  req.body.upiId ||
                    ""
                ).trim(),

              active: true,
            },

            $setOnInsert: {
              key: SETTING_KEY,
            },
          },
          {
            new: true,
            upsert: true,
            runValidators: true,
          }
        );

      if (
        oldSetting?.qrImageKey &&
        oldSetting.qrImageKey !==
          setting.qrImageKey
      ) {
        try {
          await deleteImage(
            oldSetting.qrImageKey
          );
        } catch (deleteError) {
          console.error(
            "Old QR delete error:",
            deleteError
          );
        }
      }

      return res
        .status(201)
        .json({
          message:
            "Payment QR saved successfully.",

          setting,
        });
    } catch (error) {
      console.error(
        "Payment QR upload error:",
        error
      );

      if (
        uploadedImage?.imageKey
      ) {
        try {
          await deleteImage(
            uploadedImage.imageKey
          );
        } catch (cleanupError) {
          console.error(
            "QR cleanup error:",
            cleanupError
          );
        }
      }

      return res
        .status(500)
        .json({
          message:
            error.message ||
            "Payment QR could not be uploaded.",
        });
    }
  }
);

export default router;