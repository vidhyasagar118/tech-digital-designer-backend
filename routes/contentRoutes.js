import express from "express";

import Slider from "../models/Slider.js";
import Project from "../models/Project.js";
import Service from "../models/Service.js";
import Pricing from "../models/Pricing.js";

import {
  adminOnly,
  protect,
} from "../middleware/auth.js";

import { upload } from "../middleware/upload.js";

import {
  deleteImage,
  uploadImage,
} from "../config/s3.js";

const router = express.Router();

const resources = {
  sliders: {
    Model: Slider,
    folder: "sliders",
    imageRequired: true,
  },

  projects: {
    Model: Project,
    folder: "projects",
    imageRequired: true,
  },

  services: {
    Model: Service,
    folder: "services",
    imageRequired: true,
  },

  pricing: {
    Model: Pricing,
    folder: "pricing",
    imageRequired: false,
  },
};

function parseForm(type, body = {}) {
  const parsed = { ...body };

  if (
    type === "pricing" &&
    typeof parsed.features === "string"
  ) {
    parsed.features = parsed.features
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  const booleanFields = [
    "active",
    "featured",
    "highlighted",
  ];

  booleanFields.forEach((field) => {
    if (field in parsed) {
      parsed[field] =
        parsed[field] === true ||
        parsed[field] === "true";
    }
  });

  if (
    "price" in parsed &&
    parsed.price !== ""
  ) {
    parsed.price = Number(parsed.price);
  }

  if (
    "order" in parsed &&
    parsed.order !== ""
  ) {
    parsed.order = Number(parsed.order);
  }

  return parsed;
}

Object.entries(resources).forEach(
  ([
    type,
    {
      Model,
      folder,
      imageRequired,
    },
  ]) => {
    // Public/admin content listing
    router.get(`/${type}`, async (req, res) => {
      try {
        const isAdminRequest =
          req.query.admin === "true";

        let filter = {};

        if (!isAdminRequest) {
          if (type !== "projects") {
            filter = {
              active: true,
            };
          }
        }

        const items = await Model.find(filter).sort({
          order: 1,
          createdAt: -1,
        });

        return res.status(200).json(items);
      } catch (error) {
        console.error(
          `${type} fetch error:`,
          error
        );

        return res.status(500).json({
          message:
            error.message ||
            "Content could not be loaded.",
        });
      }
    });

    // Create content
    router.post(
      `/${type}`,
      protect,
      adminOnly,
      upload.single("image"),
      async (req, res) => {
        let uploadedImage = null;

        try {
          if (imageRequired && !req.file) {
            return res.status(400).json({
              message: "Image is required.",
            });
          }

          const contentData = parseForm(
            type,
            req.body
          );

          if (req.file) {
            uploadedImage = await uploadImage(
              req.file,
              folder
            );

            contentData.imageUrl =
              uploadedImage.imageUrl;

            contentData.imageKey =
              uploadedImage.imageKey;
          }

          const item = await Model.create(
            contentData
          );

          return res.status(201).json(item);
        } catch (error) {
          console.error(
            `${type} create error:`,
            error
          );

          // Database save fail hone par uploaded
          // image ko S3 se remove karne ki koshish.
          if (uploadedImage?.imageKey) {
            try {
              await deleteImage(
                uploadedImage.imageKey
              );
            } catch (deleteError) {
              console.error(
                "Unused image cleanup error:",
                deleteError
              );
            }
          }

          if (error.name === "ValidationError") {
            return res.status(400).json({
              message: error.message,
            });
          }

          return res.status(500).json({
            message:
              error.message ||
              "Content could not be created.",
          });
        }
      }
    );

    // Update content
    router.put(
      `/${type}/:id`,
      protect,
      adminOnly,
      upload.single("image"),
      async (req, res) => {
        let newUploadedImage = null;

        try {
          const item = await Model.findById(
            req.params.id
          );

          if (!item) {
            return res.status(404).json({
              message: "Item not found.",
            });
          }

          const parsedData = parseForm(
            type,
            req.body
          );

          Object.assign(item, parsedData);

          if (req.file) {
            newUploadedImage = await uploadImage(
              req.file,
              folder
            );

            const previousImageKey =
              item.imageKey;

            item.imageUrl =
              newUploadedImage.imageUrl;

            item.imageKey =
              newUploadedImage.imageKey;

            await item.save();

            if (previousImageKey) {
              try {
                await deleteImage(
                  previousImageKey
                );
              } catch (deleteError) {
                console.error(
                  "Previous image delete error:",
                  deleteError
                );
              }
            }
          } else {
            await item.save();
          }

          return res.status(200).json(item);
        } catch (error) {
          console.error(
            `${type} update error:`,
            error
          );

          if (newUploadedImage?.imageKey) {
            try {
              await deleteImage(
                newUploadedImage.imageKey
              );
            } catch (deleteError) {
              console.error(
                "New image cleanup error:",
                deleteError
              );
            }
          }

          if (error.name === "CastError") {
            return res.status(400).json({
              message: "Invalid item ID.",
            });
          }

          if (error.name === "ValidationError") {
            return res.status(400).json({
              message: error.message,
            });
          }

          return res.status(500).json({
            message:
              error.message ||
              "Content could not be updated.",
          });
        }
      }
    );

    // Delete content
    router.delete(
      `/${type}/:id`,
      protect,
      adminOnly,
      async (req, res) => {
        try {
          const item = await Model.findById(
            req.params.id
          );

          if (!item) {
            return res.status(404).json({
              message: "Item not found.",
            });
          }

          const imageKey = item.imageKey;

          await item.deleteOne();

          if (imageKey) {
            try {
              await deleteImage(imageKey);
            } catch (deleteError) {
              console.error(
                "Deleted item image cleanup error:",
                deleteError
              );
            }
          }

          return res.status(200).json({
            message: "Deleted successfully.",
          });
        } catch (error) {
          console.error(
            `${type} delete error:`,
            error
          );

          if (error.name === "CastError") {
            return res.status(400).json({
              message: "Invalid item ID.",
            });
          }

          return res.status(500).json({
            message:
              error.message ||
              "Content could not be deleted.",
          });
        }
      }
    );
  }
);

export default router;