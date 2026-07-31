import "dotenv/config";

import cors from "cors";
import express from "express";
import multer from "multer";

import {
  connectDB,
} from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import contentRoutes from "./routes/contentRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import paymentSettingRoutes from "./routes/paymentSettingRoutes.js";

await connectDB();

const app = express();

/*
 * CLIENT_URL में trailing slash होने पर
 * CORS mismatch न हो, इसलिए उसे remove
 * किया गया है।
 */
const configuredClientUrl =
  String(
    process.env.CLIENT_URL || ""
  ).replace(/\/+$/, "");
const allowedOrigins = [
  configuredClientUrl,

  // Local React/Vite frontend
  "http://localhost:5173",

  // Deployed website
  "https://tech-digital-designer.vercel.app",
  "https://techdigitaldesigner.in",
  "https://www.techdigitaldesigner.in",

  // Capacitor Android/iOS app
  "http://localhost",
  "https://localhost",
  "capacitor://localhost",
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      /*
       * Postman, server-to-server और
       * mobile requests में origin
       * header नहीं हो सकता।
       */
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalizedOrigin =
        origin.replace(
          /\/+$/,
          ""
        );

      if (
        allowedOrigins.includes(
          normalizedOrigin
        )
      ) {
        callback(null, true);
        return;
      }

      console.error(
        "Blocked CORS origin:",
        origin
      );

      callback(
        new Error(
          `CORS blocked for origin: ${origin}`
        )
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

app.use(
  express.json({
    limit: "2mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "2mb",
  })
);

/*
 * Health route
 */
app.get(
  "/api/health",
  (req, res) => {
    res.json({
      status: "ok",
      app: "Tech Digital Designers API",
    });
  }
);

/*
 * API routes
 */
app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/content",
  contentRoutes
);

app.use(
  "/api/contact",
  contactRoutes
);

app.use(
  "/api/users",
  userRoutes
);

app.use(
  "/api/payment-settings",
  paymentSettingRoutes
);

/*
 * Unknown API route
 */
app.use(
  "/api",
  (req, res) => {
    res.status(404).json({
      message: `API route not found: ${req.method} ${req.originalUrl}`,
    });
  }
);

/*
 * Error handler
 */
app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "Server error:",
      error
    );

    /*
     * Multer file upload errors
     */
    if (
      error instanceof
      multer.MulterError
    ) {
      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {
        return res
          .status(400)
          .json({
            message:
              "Image must be smaller than 5 MB.",
          });
      }

      if (
        error.code ===
        "LIMIT_UNEXPECTED_FILE"
      ) {
        return res
          .status(400)
          .json({
            message:
              'Invalid image field. The file field must be named "image".',
          });
      }

      return res
        .status(400)
        .json({
          message:
            error.message ||
            "File upload failed.",
        });
    }

    /*
     * Custom image validation error
     */
    if (
      error.message?.includes(
        "Only JPG"
      )
    ) {
      return res
        .status(400)
        .json({
          message:
            error.message,
        });
    }

    /*
     * CORS error
     */
    if (
      error.message?.includes(
        "CORS blocked"
      )
    ) {
      return res
        .status(403)
        .json({
          message:
            error.message,
        });
    }

    /*
     * MongoDB invalid ID
     */
    if (
      error.name ===
      "CastError"
    ) {
      return res
        .status(400)
        .json({
          message:
            "Invalid resource ID.",
        });
    }

    /*
     * MongoDB duplicate key
     */
    if (
      error.code === 11000
    ) {
      return res
        .status(409)
        .json({
          message:
            "This record already exists.",
        });
    }

    return res
      .status(
        error.status ||
        error.statusCode ||
        500
      )
      .json({
        message:
          error.message ||
          "Internal server error.",
      });
  }
);

const port =
  process.env.PORT || 5000;

app.listen(port, () => {
  console.log(
    `Server running on port ${port}`
  );

  console.log(
    "Allowed origins:",
    allowedOrigins
  );
});