import express from "express";

import PaymentSetting from "../models/PaymentSetting.js";
import Contact from "../models/Contact.js";

import {
  adminOnly,
  protect,
} from "../middleware/auth.js";

const router = express.Router();

function cleanText(
  value,
  maximumLength
) {
  return String(value || "")
    .trim()
    .slice(0, maximumLength);
}

/* Public: submit enquiry */
router.post("/", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      serviceId,
      service,
      serviceImage,
      budget,
      message,
      whatsappConsent,
    } = req.body;

    if (
      !name ||
      !email ||
      !phone ||
      !service ||
      !message
    ) {
      return res
        .status(400)
        .json({
          message:
            "Please complete all required fields.",
        });
    }

    const normalizedPhone =
      String(phone).replace(
        /\D/g,
        ""
      );

    if (
      !/^[6-9]\d{9}$/.test(
        normalizedPhone
      )
    ) {
      return res
        .status(400)
        .json({
          message:
            "Please enter a valid 10-digit Indian mobile number.",
        });
    }

    const enquiry =
      await Contact.create({
        name: cleanText(
          name,
          100
        ),

        email: cleanText(
          email,
          150
        ).toLowerCase(),

        phone:
          normalizedPhone,

        serviceId:
          serviceId || null,

        service: cleanText(
          service,
          150
        ),

        serviceImage:
          cleanText(
            serviceImage,
            1000
          ),

        budget: cleanText(
          budget,
          100
        ),

        message: cleanText(
          message,
          3000
        ),

        whatsappConsent:
          Boolean(
            whatsappConsent
          ),
      });

    return res
      .status(201)
      .json({
        message:
          "Your enquiry has been submitted successfully.",

        enquiryId:
          enquiry._id,

        enquiry,
      });
  } catch (error) {
    console.error(
      "Contact submission error:",
      error
    );

    return res
      .status(500)
      .json({
        message:
          error.message ||
          "Enquiry could not be submitted.",
      });
  }
});

/* Admin: get enquiries */
router.get(
  "/",
  protect,
  adminOnly,
  async (req, res) => {
    try {
      const enquiries =
        await Contact.find()
          .sort({
            createdAt: -1,
          })
          .lean();

      return res.json(
        enquiries
      );
    } catch (error) {
      return res
        .status(500)
        .json({
          message:
            error.message,
        });
    }
  }
);

/* Admin: approve enquiry */
router.patch(
  "/:id/approve",
  protect,
  adminOnly,
  async (req, res) => {
    try {
      const paymentSetting =
        await PaymentSetting.findOne({
          key: "main-payment",
          active: true,
        });

      if (
        !paymentSetting ||
        !paymentSetting
          .qrImageUrl
      ) {
        return res
          .status(400)
          .json({
            message:
              "पहले Admin Panel में payment QR upload करें।",
          });
      }

      const enquiry =
        await Contact.findByIdAndUpdate(
          req.params.id,
          {
            status:
              "approved",

            paymentQrUrl:
              paymentSetting
                .qrImageUrl,

            paymentUpiId:
              paymentSetting
                .upiId || "",

            paymentAccountName:
              paymentSetting
                .accountName ||
              "",

            adminMessage:
              cleanText(
                req.body
                  .adminMessage ||
                  "Your enquiry has been approved. Please complete payment using the QR link.",
                1000
              ),

            approvedAt:
              new Date(),
          },
          {
            new: true,
            runValidators: true,
          }
        );

      if (!enquiry) {
        return res
          .status(404)
          .json({
            message:
              "Enquiry not found.",
          });
      }

      return res.json({
        message:
          "Enquiry approved successfully.",

        enquiry,
      });
    } catch (error) {
      console.error(
        "Enquiry approval error:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            error.message ||
            "Enquiry could not be approved.",
        });
    }
  }
);

/* Admin: update status */
router.patch(
  "/:id/status",
  protect,
  adminOnly,
  async (req, res) => {
    try {
      const allowedStatuses = [
        "new",
        "contacted",
        "approved",
        "payment_pending",
        "paid",
        "rejected",
        "closed",
      ];

      if (
        !allowedStatuses.includes(
          req.body.status
        )
      ) {
        return res
          .status(400)
          .json({
            message:
              "Invalid enquiry status.",
          });
      }

      const enquiry =
        await Contact.findByIdAndUpdate(
          req.params.id,
          {
            status:
              req.body.status,
          },
          {
            new: true,
            runValidators: true,
          }
        );

      if (!enquiry) {
        return res
          .status(404)
          .json({
            message:
              "Enquiry not found.",
          });
      }

      return res.json(
        enquiry
      );
    } catch (error) {
      return res
        .status(500)
        .json({
          message:
            error.message,
        });
    }
  }
);

export default router;