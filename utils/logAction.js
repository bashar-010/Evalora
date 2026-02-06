import Log from "../models/Log.js";

export const logAction = async (req, action, details = "") => {
  try {
    await Log.create({
      user: req.user?.id || req.user?._id || null,
      action,
      details,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
  } catch (error) {
    console.error("Logging failed:", error.message);
  }
};