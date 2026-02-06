// utils/scoringService.js
import User from '../models/User.js';
import Project from '../models/Project.js';
import { scoreWithHF } from './hfClient.js';

/**
 * Centrally recalculates a user's overall AI score and analysis.
 * This should be called whenever projects, skills, or achievements change.
 * 
 * @param {String} userId - The ID of the user to recalculate
 * @param {Object} [additionalData] - Optional incoming data (e.g. from an active request)
 */
function normalizeTitle(title) {
    if (!title) return '';
    return title.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

export async function recalculateUserScore(userId, additionalData = {}) {
    console.log(`[ScoringService] Recalculating score for UserID: ${userId}`);
    try {
        // 1) Fetch full user data from DB
        const user = await User.findById(userId);
        if (!user) {
            console.error(`[ScoringService] User not found: ${userId}`);
            return null;
        }

        // 2) Fetch user projects
        const dbProjects = await Project.find({ user: userId });

        // 3) Construct profile for AI
        const profile = {
            name: user.name || 'Student',
            skills: additionalData.skills || user.skills || [],
            achievements: user.achievements || [],
            projects: dbProjects.map(p => ({
                title: p.title,
                description: p.description,
                techStack: p.technologies || [],
                score: p.score || 0,
                isManualScore: p.isManualScore || false,
                companyScore: p.companyScore,
                verificationStatus: p.companyVerificationStatus
            })),
            activity: {
                // Here we can eventually pull real activity tags/logs
                loginsLast30Days: 5, // Mock baseline
                submissionsCount: dbProjects.length,
                pagesViewed: 20
            }
        };

        // 4) Get AI evaluation
        console.log(`[ScoringService] Requesting AI score for user: ${user.name}`);
        const scores = await scoreWithHF(profile);

        // 5) Save back to User model
        const overallScore = Number(scores?.overall_score);

        if (scores && !isNaN(overallScore) && isFinite(overallScore)) {
            try {
                const result = await User.findOneAndUpdate(
                    { _id: userId },
                    {
                        $set: {
                            score: overallScore,
                            scoreAnalysis: {
                                summary: scores.summary,
                                strengths: scores.strengths,
                                weaknesses: scores.weaknesses,
                                recommendations: scores.recommendations
                            }
                        }
                    },
                    { new: true }
                );

                if (result) {
                    console.log(`[ScoringService] Successfully updated profile for ${result.name}: ${overallScore}`);

                    // 6) Update individual project scores from AI evaluations
                    const evaluations = scores.projectEvaluations || [];
                    console.log(`[ScoringService] Processing ${evaluations.length} project evaluations`);

                    for (const evalObj of evaluations) {
                        try {
                            const projectTitle = (evalObj.title || '').trim();
                            const newScore = evalObj.isValid === false ? 0 : (evalObj.score || 0);
                            const newStatus = evalObj.isValid === false ? "Rejected" : "scored";
                            const newNotes = evalObj.isValid === false
                                ? (evalObj.feedback || "Project rejected: Invalid content or insufficient details.")
                                : (evalObj.feedback || "Evaluation completed.");

                            console.log(`[ScoringService] Updating project "${projectTitle}": isValid=${evalObj.isValid}, score=${newScore}, status=${newStatus}`);

                            // 1. Try Exact Match (Case Insensitive)
                            const escapedTitle = projectTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            let updateResult = await Project.findOneAndUpdate(
                                { user: userId, title: { $regex: new RegExp(`^${escapedTitle}$`, 'i') } },
                                {
                                    $set: {
                                        score: newScore,
                                        aiScore: evalObj.rawAiScore || newScore,
                                        reviewerNotes: newNotes,
                                        status: newStatus
                                    }
                                },
                                { new: true }
                            );

                            // 2. Try Alphanumeric-only Match (e.g. "E-pharma" vs "epharma")
                            if (!updateResult) {
                                const normalizedTitle = normalizeTitle(projectTitle);
                                console.log(`[ScoringService] Exact match failed for "${projectTitle}". Trying normalized match: "${normalizedTitle}"`);

                                // We fetch all user projects and match in JS to handle normalization
                                const allProjects = await Project.find({ user: userId });
                                const matchedProject = allProjects.find(p => normalizeTitle(p.title) === normalizedTitle);

                                if (matchedProject) {
                                    updateResult = await Project.findOneAndUpdate(
                                        { _id: matchedProject._id },
                                        {
                                            $set: {
                                                score: newScore,
                                                aiScore: evalObj.rawAiScore || newScore,
                                                reviewerNotes: newNotes,
                                                status: newStatus
                                            }
                                        },
                                        { new: true }
                                    );
                                }
                            }

                            // 3. Fallback: Contains Match
                            if (!updateResult) {
                                console.log(`[ScoringService] Normalized match failed for "${projectTitle}". Trying partial (contains) match...`);
                                updateResult = await Project.findOneAndUpdate(
                                    { user: userId, title: { $regex: new RegExp(escapedTitle, 'i') } },
                                    {
                                        $set: {
                                            score: newScore,
                                            aiScore: evalObj.rawAiScore || newScore,
                                            reviewerNotes: newNotes,
                                            status: newStatus
                                        }
                                    },
                                    { new: true }
                                );
                            }

                            if (updateResult) {
                                console.log(`[ScoringService] ✓ Updated project "${updateResult.title}" (matched from "${projectTitle}") in DB -> score: ${newScore}, status: ${newStatus}`);
                            } else {
                                console.warn(`[ScoringService] ✗ Project "${projectTitle}" not found in DB for user ${userId} even with partial matching.`);
                            }
                        } catch (pErr) {
                            console.error(`[ScoringService] Failed to update project "${evalObj.title}":`, pErr);
                        }
                    }
                    console.log(`[ScoringService] Finished updating individual project scores.`);
                } else {
                    console.error(`[ScoringService] Failed to update user in DB: ${userId}`);
                }
            } catch (updateErr) {
                console.error(`[ScoringService] DB Update Error:`, updateErr);
            }
            return scores;
        }

        return null;
    } catch (err) {
        console.error('[ScoringService] Error during recalculation:', err);
        throw err;
    }
}
