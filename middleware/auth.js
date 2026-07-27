import jwt from "jsonwebtoken";

import User from "../models/User.js";

export async function protect(
  req,
  res,
  next
) {
  try {
    const authorization =
      req.headers.authorization;

    if (
      !authorization ||
      !authorization.startsWith(
        "Bearer "
      )
    ) {
      return res.status(401).json({
        message:
          "Authentication token is missing.",
      });
    }

    const token =
      authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message:
          "Authentication token is missing.",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user =
      await User.findById(
        decoded.id
      ).select("-password");

    if (!user) {
      return res.status(401).json({
        message:
          "User account was not found.",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      message:
        error.name ===
        "TokenExpiredError"
          ? "Login expired. Please login again."
          : "Invalid authentication token.",
    });
  }
}

export function adminOnly(
  req,
  res,
  next
) {
  if (
    req.user?.role !== "admin"
  ) {
    return res.status(403).json({
      message:
        "Admin access is required.",
    });
  }

  next();
}