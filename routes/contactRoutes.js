import express from "express";
import mongoose from "mongoose";

import Contact from "../models/Contact.js";
import PaymentSetting from "../models/PaymentSetting.js";
import Pricing from "../models/Pricing.js";
import Service from "../models/Service.js";

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

/*
 * Public:
 * Create a new service enquiry.
 */
router.post(
  "/",
  async (req, res) => {
    try {
      const {
        name,
        email,
        phone,
        serviceId,
        service,
        serviceImage,
        pricingId,
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

      /*
       * Service की जानकारी database
       * से verify की जाएगी।
       */
      let selectedService = null;

      if (
        serviceId &&
        mongoose.isValidObjectId(
          serviceId
        )
      ) {
        selectedService =
          await Service.findById(
            serviceId
          );
      }

      /*
       * Client से भेजी गई price को
       * trust नहीं करेंगे।
       *
       * Real price Pricing collection
       * से ली जाएगी।
       */
      let selectedPricing = null;

      if (pricingId) {
        if (
          !mongoose.isValidObjectId(
            pricingId
          )
        ) {
          return res
            .status(400)
            .json({
              message:
                "Invalid pricing plan selected.",
            });
        }

        selectedPricing =
          await Pricing.findOne({
            _id: pricingId,
            active: true,
          });

        if (!selectedPricing) {
          return res
            .status(400)
            .json({
              message:
                "Selected pricing plan is no longer available.",
            });
        }

        const requestedSlug =
          selectedService
            ?.categorySlug || "";

        /*
         * Selected pricing plan उसी
         * service category का होना चाहिए।
         */
        if (
          selectedPricing
            .serviceCategorySlug &&
          requestedSlug &&
          selectedPricing
            .serviceCategorySlug !==
            requestedSlug
        ) {
          return res
            .status(400)
            .json({
              message:
                "Selected plan does not belong to this service category.",
            });
        }
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
            selectedService?._id ||
            null,

          service: cleanText(
            selectedService?.title ||
              service,
            150
          ),

          serviceCategory:
            cleanText(
              selectedService
                ?.category,
              150
            ),

          serviceCategorySlug:
            cleanText(
              selectedService
                ?.categorySlug,
              150
            ),

          serviceImage:
            cleanText(
              selectedService
                ?.imageUrl ||
                serviceImage,
              1000
            ),

          pricingId:
            selectedPricing?._id ||
            null,

          selectedPlan:
            cleanText(
              selectedPricing
                ?.planName ||
                "Custom Quote",
              150
            ),

          selectedPrice:
            selectedPricing?.price ??
            null,

          selectedBillingText:
            cleanText(
              selectedPricing
                ?.billingText,
              200
            ),

          budget:
            selectedPricing
              ? `₹${Number(
                  selectedPricing
                    .price
                ).toLocaleString(
                  "en-IN"
                )}`
              : "Custom quotation",

          message: cleanText(
            message,
            3000
          ),

          whatsappConsent:
            whatsappConsent ===
              true ||
            whatsappConsent ===
              "true",
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
  }
);

/*
 * Admin:
 * Get all enquiries.
 */
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

/*
 * Admin:
 * Approve enquiry and attach
 * saved Payment QR.
 */
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
        !paymentSetting
          ?.qrImageUrl
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
                .upiId ||
              "",

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

/*
 * Admin:
 * Update enquiry status.
 */
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