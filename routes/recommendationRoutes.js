import express from "express";
import Opportunity from "../models/Opportunity.js";
import User from "../models/User.js";
import Project from "../models/Project.js";
import auth from "../middleware/auth.js";

const router = express.Router();

/*----------------------------------------
   GET AI RECOMMENDATIONS
----------------------------------------*/
router.get("/", auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const [user, userProjects] = await Promise.all([
            User.findById(userId),
            Project.find({ user: userId })
        ]);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // 1) Get all open opportunities
        const opportunities = await Opportunity.find({ isOpen: true }).populate("company", "name");

        // 2) Collect User Context for Matching
        const userSkills = (user.skills || []).map(s => s.toLowerCase());
        const userProjectTech = userProjects.flatMap(p => (p.technologies || []).map(t => t.toLowerCase()));
        const userProjectTitles = userProjects.map(p => p.title.toLowerCase());
        const userProjectDescs = userProjects.map(p => (p.description || "").toLowerCase());
        const userAchievementTitles = (user.achievements || []).map(a => a.title.toLowerCase());
        const userAchievementDescs = (user.achievements || []).map(a => (a.description || "").toLowerCase());

        // Combine all tech/skills and content for deeper matching
        const allUserTech = [...new Set([...userSkills, ...userProjectTech])];
        const allUserContent = [...userProjectTitles, ...userProjectDescs, ...userAchievementTitles, ...userAchievementDescs];

        let recommended = opportunities.map(opp => {
            let score = 0;
            const oppRequirements = (opp.requirements || []).map(r => r.toLowerCase());
            const oppDescription = (opp.description || "").toLowerCase();
            const oppTitle = (opp.title || "").toLowerCase();
            const matchReasons = [];

            // A) Match Requirements (Additive Scoring)
            let matchScore = 0;

            oppRequirements.forEach(req => {
                const reqLower = req.toLowerCase();
                if (userSkills.includes(reqLower)) {
                    matchScore += 9; // Direct skill match
                    if (matchReasons.length < 3) matchReasons.push(`Matches your skill: ${req}`);
                } else if (userProjectTech.includes(reqLower)) {
                    matchScore += 7; // Project experience match
                    if (matchReasons.length < 3) matchReasons.push(`Relates to your project experience with ${req}`);
                } else if (allUserContent.some(content => content.includes(reqLower))) {
                    matchScore += 3; // Mentioned in description
                }
            });

            // B) Bonus Context (Title/Description keywords)
            allUserTech.forEach(tech => {
                const techLower = tech.toLowerCase();
                if (oppTitle.includes(techLower) || oppDescription.includes(techLower)) {
                    matchScore += 2;
                    if (matchReasons.length < 3 && !matchReasons.some(r => r.includes(tech))) {
                        matchReasons.push(`Matches your interest in ${tech}`);
                    }
                }
            });

            // C) Broad domain matching keywords
            allUserContent.forEach(content => {
                const words = content.split(/\s+/).filter(w => w.length > 4);
                words.forEach(word => {
                    const wordLower = word.toLowerCase();
                    if (oppTitle.includes(wordLower)) {
                        matchScore += 1;
                        if (matchReasons.length < 3 && !matchReasons.some(r => r.includes(wordLower))) {
                            matchReasons.push(`Strong keyword match: ${wordLower}`);
                        }
                    }
                });
            });


            // D) Round and apply limits
            matchScore = Math.round(matchScore);

            // Strict Penalty
            const hasCoreMatch = oppRequirements.some(req => {
                const r = req.toLowerCase();
                return userSkills.includes(r) || userProjectTech.includes(r);
            });

            if (oppRequirements.length > 0 && !hasCoreMatch) {
                matchScore = Math.round(matchScore * 0.1);
            }

            // Final limits (0-99%)
            matchScore = Math.min(Math.max(matchScore, 0), 99);

            // E) DEFAULT RECOMMENDATION (Major-based fallback)
            const techKeywords = ['computer science', 'software', 'programming', 'tech', 'it', 'web', 'data', 'ai', 'cybersecurity'];
            const businessKeywords = ['business', 'marketing', 'finance', 'management', 'economics', 'hr', 'human resources'];
            const engineeringKeywords = ['engineering', 'mechanical', 'electrical', 'civil', 'architecture'];

            const userMajorLower = (user.major || '').toLowerCase();
            const totalText = (oppTitle + " " + oppDescription).toLowerCase();

            let matchesDomain = false;
            if (techKeywords.some(k => userMajorLower.includes(k)) && techKeywords.some(k => totalText.includes(k))) matchesDomain = true;
            if (businessKeywords.some(k => userMajorLower.includes(k)) && businessKeywords.some(k => totalText.includes(k))) matchesDomain = true;
            if (engineeringKeywords.some(k => userMajorLower.includes(k)) && engineeringKeywords.some(k => totalText.includes(k))) matchesDomain = true;

            if (matchesDomain) {
                matchScore = Math.max(matchScore, 25);
                if (matchReasons.length === 0) matchReasons.push(`Aligned with your major: ${user.major}`);
            }

            if (userMajorLower && totalText.includes(userMajorLower)) {
                matchScore = Math.max(matchScore, 40);
                if (!matchReasons.some(r => r.includes('major'))) matchReasons.push(`Directly matches your major: ${user.major}`);
            }

            return {
                ...opp.toObject(),
                matchScore,
                matchReasons
            };
        }).filter(opp => opp.matchScore >= 5);
        // Only return things with at least some relevance

        // 3) Sort by matchScore descending
        recommended.sort((a, b) => b.matchScore - a.matchScore);

        // 4) Fallback: If less than 3 recommendations, add latest open opportunities
        if (recommended.length < 3) {
            const alreadyRecommendedIds = recommended.map(r => r._id.toString());
            const latestOpps = opportunities
                .filter(opp => !alreadyRecommendedIds.includes(opp._id.toString()))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 6 - recommended.length)
                .map(opp => ({ ...opp.toObject(), matchScore: 15, matchReasons: ["Recently added to the platform"] }));

            recommended = [...recommended, ...latestOpps];
        }

        // 5) Return top 6
        res.json({ recommendations: recommended.slice(0, 6) });

    } catch (error) {
        console.error("Recommendations error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
