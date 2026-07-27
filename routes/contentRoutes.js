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
  },
  projects: {
    Model: Project,
    folder: "projects",
  },
  services: {
    Model: Service,
    folder: "services",
  },
  pricing: {
    Model: Pricing,
    folder: "pricing",
  },
};

function parseForm(type, body) {
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

  ["active", "featured", "highlighted"].forEach(
    (field) => {
      if (field in parsed) {
        parsed[field] =
          parsed[field] === true ||
          parsed[field] === "true";
      }
    }
  );

  if ("price" in parsed) {
    parsed.price = Number(parsed.price);
  }

  if ("order" in parsed) {
    parsed.order = Number(parsed.order);
  }

  return parsed;
}

Object.entries(resources).forEach(
  ([type, { Model, folder }]) => {
    router.get(`/${type}`, async (req, res) => {
      try {
        const filter =
          req.query.admin === "true"
            ? {}
            : type === "projects"
            ? {}
            : { active: true };

        const items = await Model.find(filter).sort({
          order: 1,
          createdAt: -1,
        });

        res.json(items);
      } catch (error) {
        res.status(500).json({
          message: error.message,
        });
      }
    });

    router.post(
      `/${type}`,
      protect,
      adminOnly,
      upload.single("image"),
      async (req, res) => {
        try {
          if (!req.file) {
            return res.status(400).json({
              message: "Image is required",
            });
          }

          const uploaded = await uploadImage(
            req.file,
            folder
          );

          const item = await Model.create({
            ...parseForm(type, req.body),
            ...uploaded,
          });

          res.status(201).json(item);
        } catch (error) {
          res.status(500).json({
            message: error.message,
          });
        }
      }
    );

    router.put(
      `/${type}/:id`,
      protect,
      adminOnly,
      upload.single("image"),
      async (req, res) => {
        try {
          const item = await Model.findById(
            req.params.id
          );

          if (!item) {
            return res.status(404).json({
              message: "Item not found",
            });
          }

          Object.assign(
            item,
            parseForm(type, req.body)
          );

          if (req.file) {
            await deleteImage(item.imageKey);

            const uploaded = await uploadImage(
              req.file,
              folder
            );

            item.imageUrl = uploaded.imageUrl;
            item.imageKey = uploaded.imageKey;
          }

          await item.save();
          res.json(item);
        } catch (error) {
          res.status(500).json({
            message: error.message,
          });
        }
      }
    );

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
              message: "Item not found",
            });
          }

          await deleteImage(item.imageKey);
          await item.deleteOne();

          res.json({
            message: "Deleted successfully",
          });
        } catch (error) {
          res.status(500).json({
            message: error.message,
          });
        }
      }
    );
  }
);

export default router;
