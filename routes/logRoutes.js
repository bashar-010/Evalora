import express from "express";
import Log from "../models/Log.js";
import { verifyToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    const logs = await Log.find()
      .populate("user", "name email role")
      .sort({ createdAt: -1 });

    res.json({ logs });
  } catch (error) {
    res.status(500).json({ message: "Cannot fetch logs" });
  }
});

export default router;