// routes/leaderboardRoutes.js

import express from "express";
import User from "../models/User.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/* ====================================
   GET Leaderboard (Top Students)
==================================== */
/**
 * @route   GET /api/leaderboard
 * @desc    Returns list of top students sorted by score
 * @access  Private
 */
router.get("/", verifyToken, async (req, res) => {
  try {

    const topStudents = await User.find({ role: "user" })
      .select("name email score")  // فقط هذه الحقول
      .sort({ score: -1 })         // ترتيب تنازلي
      .limit(50);                  // أفضل 50 طالب

    res.json({
      total: topStudents.length,
      students: topStudents,
    });

  } catch (error) {
    console.error("Leaderboard Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;