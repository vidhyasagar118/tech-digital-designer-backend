import mongoose from "mongoose";

function createSlug(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const serviceSchema =
  new mongoose.Schema(
    {
      // Individual service name
      title: {
        type: String,
        required: [
          true,
          "Service title is required.",
        ],
        trim: true,
        maxlength: 150,
      },

      // Main category name
      category: {
        type: String,
        required: [
          true,
          "Service category is required.",
        ],
        trim: true,
        default: "Other Services",
        maxlength: 120,
      },

      // Used in URL:
      // /services?category=website-development
      categorySlug: {
        type: String,
        trim: true,
        lowercase: true,
        default: "",
        maxlength: 140,
      },

      // Category introduction on Services page
      categoryDescription: {
        type: String,
        trim: true,
        default: "",
        maxlength: 500,
      },

      // Category position on Home/Services
      categoryOrder: {
        type: Number,
        default: 0,
        min: 0,
      },

      /*
       * Same category की केवल एक service पर
       * इसे true रखना है। उसकी image और category
       * description Home page card पर आएगी।
       */
      showCategoryOnHome: {
        type: Boolean,
        default: false,
      },

      // Short service card description
      shortDescription: {
        type: String,
        required: [
          true,
          "Short description is required.",
        ],
        trim: true,
        maxlength: 400,
      },

      // Complete service information
      description: {
        type: String,
        trim: true,
        default: "",
        maxlength: 5000,
      },

      // S3 image URL
      imageUrl: {
        type: String,
        required: [
          true,
          "Service image URL is required.",
        ],
        trim: true,
      },

      // S3 object key
      imageKey: {
        type: String,
        required: [
          true,
          "Service image key is required.",
        ],
        trim: true,
      },

      // Individual service position
      order: {
        type: Number,
        default: 0,
        min: 0,
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

/*
 * Category slug खाली होने पर category
 * name से automatically generate होगा।
 */
serviceSchema.pre(
  "validate",
  function generateCategorySlug() {
    this.category =
      this.category?.trim() ||
      "Other Services";

    this.categorySlug =
      createSlug(
        this.categorySlug ||
          this.category
      ) || "other-services";
  }
);

export default mongoose.model(
  "Service",
  serviceSchema
);