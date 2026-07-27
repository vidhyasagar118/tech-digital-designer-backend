import express from "express";

import User from "../models/User.js";
import {
  adminOnly,
  protect,
} from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, adminOnly, async (req, res) => {
  const users = await User.find()
    .select("-password")
    .sort({ createdAt: -1 });

  res.json(users);
});

export default router;
