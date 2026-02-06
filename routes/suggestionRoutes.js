import express from "express";
import Opportunity from "../models/Opportunity.js";
import Project from "../models/Project.js";
import User from "../models/User.js";
import auth from "../middleware/auth.js";

const router = express.Router();

/* ---------------------------------------
   اقتراح طلاب مناسبين لفرصة لشركة
   GET /api/suggestions/students/:opportunityId
---------------------------------------- */
router.get("/students/:opportunityId", auth, async (req, res) => {
  try {
    // فقط للشركات
    if (req.user.role !== "company") {
      return res.status(403).json({ message: "Only companies can view suggestions" });
    }

    const opportunity = await Opportunity.findById(req.params.opportunityId);
    if (!opportunity) {
      return res.status(404).json({ message: "Opportunity not found" });
    }

    const requiredSkills = opportunity.requirements.map(r => r.toLowerCase());

    // جميع المشاريع
    const projects = await Project.find()
      .populate("user", "name email score");

    // نجمع مهارات كل طالب من مشاريعهم
    const candidates = {};

    projects.forEach(p => {
      const userId = p.user._id.toString();

      if (!candidates[userId]) {
        candidates[userId] = {
          user: p.user,
          skills: new Set(),
          score: p.user.score || 0,
          matchCount: 0
        };
      }

      p.technologies?.forEach(t => {
        candidates[userId].skills.add(t.toLowerCase());
      });
    });

    // حساب التوافق
    const result = Object.values(candidates).map(c => {
      let matched = 0;
      requiredSkills.forEach(skill => {
        if (c.skills.has(skill)) matched++;
      });

      const matchPercent =
        requiredSkills.length === 0
          ? 0
          : Math.round((matched / requiredSkills.length) * 100);

      return {
        student: c.user,
        matchPercent,
        score: c.score,
      };
    });

    // ترتيب حسب:
    // أعلى توافق + أعلى سكور
    result.sort((a, b) => {
      if (b.matchPercent === a.matchPercent) {
        return b.score - a.score;
      }
      return b.matchPercent - a.matchPercent;
    });

    res.json(result.slice(0, 20)); // أعلى 20 طالب
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------------------------------
   اقتراح فرص مناسبة لطالب
   GET /api/suggestions/opportunities
---------------------------------------- */
router.get("/opportunities", auth, async (req, res) => {
  try {
    // فقط للطلاب
    if (req.user.role !== "user") {
      return res.status(403).json({ message: "Only students can view suggestions" });
    }

    const projects = await Project.find({ user: req.user.id });
    const mySkills = new Set();

    projects.forEach(p => {
      p.technologies?.forEach(t => mySkills.add(t.toLowerCase()));
    });

    const opportunities = await Opportunity.find({ isOpen: true });

    const results = opportunities.map(op => {
      const required = op.requirements.map(r => r.toLowerCase());
      let match = 0;

      required.forEach(skill => {
        if (mySkills.has(skill)) match++;
      });

      const matchPercent =
        required.length === 0 ? 0 : Math.round((match / required.length) * 100);

      return {
        opportunity: op,
        matchPercent
      };
    });

    // ترتيب حسب التوافق
    results.sort((a, b) => b.matchPercent - a.matchPercent);

    res.json(results.slice(0, 10)); // أفضل 10 فرص
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;