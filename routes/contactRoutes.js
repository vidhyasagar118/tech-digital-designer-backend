import express from "express";

import Contact from "../models/Contact.js";
import {
  adminOnly,
  protect,
} from "../middleware/auth.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const enquiry = await Contact.create(req.body);

    res.status(201).json({
      message: "Enquiry submitted successfully",
      enquiry,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

router.get("/", protect, adminOnly, async (req, res) => {
  const enquiries = await Contact.find().sort({
    createdAt: -1,
  });

  res.json(enquiries);
});

router.patch(
  "/:id/status",
  protect,
  adminOnly,
  async (req, res) => {
    const enquiry = await Contact.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    res.json(enquiry);
  }
);

export default router;
