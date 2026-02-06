import express from 'express';
import { recalculateUserScore } from '../utils/scoringService.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/score-student
 * Body: { name, projects, skills, activity }
 */
router.post('/score-student', verifyToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const incomingData = req.body;

    // Use the central service to recalculate everything
    const scores = await recalculateUserScore(userId, incomingData);

    if (!scores) {
      return res.status(500).json({
        success: false,
        message: "Failed to recalculate score"
      });
    }

    return res.json({
      success: true,
      scores
    });
  } catch (err) {
    console.error('Scoring Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;
