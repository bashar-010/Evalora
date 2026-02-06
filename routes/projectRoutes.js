// routes/projectRoutes.js

import express from "express";
import axios from "axios";
import crypto from "crypto";

import Project from "../models/Project.js";
import User from "../models/User.js";
import auth from "../middleware/auth.js";
import Notification from "../models/Notification.js";
import { logAction } from "../utils/logAction.js";
import { recalculateUserScore } from "../utils/scoringService.js";
import { sendCompanyProjectVerificationEmail } from "../utils/emailService.js";

const router = express.Router();

/* =====================================
   CREATE PROJECT + AI SCORING
===================================== */
/**
 * @route   POST /api/projects
 * @desc    Student submits a project → AI evaluates → score saved
 * @access  Private (Students only)
 */
router.post("/", auth, async (req, res) => {
  try {
    const { id, role } = req.user;

    // Only students allowed
    if (role !== "user") {
      return res.status(403).json({
        message: "Only students can submit projects",
      });
    }

    const { title, description, repoUrl, technologies, belongsToCompany } = req.body;

    // Validate
    if (!title) {
      return res.status(400).json({ message: "Project title is required" });
    }

    // Check if company exists (if specified)
    let company = null;
    let isCompanyProject = false;
    if (belongsToCompany) {
      company = await User.findOne({ _id: belongsToCompany, role: "company" });
      if (!company) {
        return res.status(400).json({ message: "Invalid company selected" });
      }
      isCompanyProject = true;
    }

    // Generate verification token for company projects
    const verificationToken = isCompanyProject ? crypto.randomBytes(32).toString("hex") : null;

    // 1) Create and Save Initial Project
    const project = new Project({
      user: id,
      title,
      description,
      repoUrl,
      technologies,
      status: isCompanyProject ? "awaiting_company_verification" : "pending",
      belongsToCompany: isCompanyProject ? belongsToCompany : null,
      companyVerificationStatus: isCompanyProject ? "pending_verification" : "not_applicable",
      companyVerificationToken: verificationToken,
    });

    await project.save();

    // Get student info for notifications
    const student = await User.findById(id);

    await logAction(
      req,
      `Project created: ${project.title}${isCompanyProject ? " (awaiting company verification)" : ""}`
    );

    // Notify all admins about new project
    const admins = await User.find({ role: "admin" });
    for (const admin of admins) {
      await Notification.create({
        user: admin._id,
        title: isCompanyProject ? "New Company Project Submitted" : "New Project Submitted",
        message: isCompanyProject
          ? `A new project "${title}" has been submitted claiming association with ${company.name}. Awaiting company verification.`
          : `A new project "${title}" has been submitted for review.`,
        type: "project",
        link: "managesproject.html"
      });
    }

    // If company project, send verification email to company
    if (isCompanyProject) {
      // Send email to company (async, don't block response)
      sendCompanyProjectVerificationEmail(
        company.email,
        company.name,
        student.name,
        title,
        project._id.toString(),
        verificationToken
      ).catch(err => console.error("Failed to send company verification email:", err));

      // Notify company in-app
      await Notification.create({
        user: company._id,
        title: "Project Verification Required",
        message: `Student ${student.name} claims their project "${title}" belongs to your company. Please verify.`,
        type: "project",
        link: "company-verifications.html"
      });
    }

    // 2) Send Response Immediately (Don't keep user waiting)
    res.status(201).json({
      message: isCompanyProject
        ? "Project submitted successfully. Awaiting company verification before scoring."
        : "Project submitted successfully. AI evaluation is in progress.",
      project,
    });

    // 3) Background AI Processing (only for non-company projects)
    if (!isCompanyProject) {
      (async () => {
        try {
          console.log("[Background] Starting AI scoring with HuggingFace via ScoringService...");
          const aiResponse = await recalculateUserScore(id);

          // Find this specific project's evaluation from AI response
          const projectEvaluations = aiResponse?.projectEvaluations || [];
          const thisProjectEval = projectEvaluations.find(
            e => e.title && e.title.toLowerCase().trim() === title.toLowerCase().trim()
          );

          let projectScore = 0;
          let projectStatus = "pending";
          let reviewerNotes = "Evaluation pending.";

          if (thisProjectEval) {
            // Check if project was rejected (gibberish/invalid content)
            if (thisProjectEval.isValid === false) {
              projectScore = 0;
              projectStatus = "Rejected";
              reviewerNotes = thisProjectEval.feedback || "Project rejected: Invalid content or insufficient details.";
              console.log(`[Background] Project "${title}" REJECTED: ${reviewerNotes}`);
            } else {
              projectScore = thisProjectEval.score || 0;
              projectStatus = "scored";
              reviewerNotes = thisProjectEval.feedback || "Evaluation completed.";
              console.log(`[Background] Project "${title}" scored: ${projectScore}`);
            }
          } else {
            // Fallback: use portfolio score if no individual evaluation found
            projectScore = aiResponse?.breakdown?.portfolio || aiResponse?.overall_score || 0;
            projectStatus = projectScore > 0 ? "scored" : "pending";
            reviewerNotes = "AI evaluation completed.";
            console.log(`[Background] Project "${title}" fallback score: ${projectScore}`);
          }

          // Update Project with individual evaluation
          project.score = projectScore;
          project.aiDetails = aiResponse;
          project.status = projectStatus;
          project.reviewerNotes = reviewerNotes;
          await project.save();

          // Create Notification (only for valid projects with score > 0)
          if (projectStatus === "scored" && projectScore > 0) {
            await Notification.create({
              user: id,
              title: "AI Evaluation Completed",
              message: `Your project "${project.title}" has been evaluated! Score: ${projectScore}/100`,
              type: "ai",
              link: "profile.html",
            });
          } else if (projectStatus === "Rejected") {
            await Notification.create({
              user: id,
              title: "Project Rejected",
              message: `Your project "${project.title}" was rejected: ${reviewerNotes}`,
              type: "warning",
              link: "profile.html",
            });
          }

        } catch (bgError) {
          console.error("Background AI Error:", bgError.message);
          // Project remains 'pending'
        }
      })();
    } // End of !isCompanyProject check

  } catch (error) {
    console.error("Project creation error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================
   GET USER PROJECTS (MY)
===================================== */
router.get("/my", auth, async (req, res) => {
  try {
    const projects = await Project.find({ user: req.user.id })
      .populate("belongsToCompany", "name")
      .sort({
        createdAt: -1,
      });
    res.json({ projects });
  } catch (error) {
    console.error("Fetch my projects error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================
   GET PROJECTS BY USER ID
===================================== */
router.get("/user/:userId", auth, async (req, res) => {
  try {
    const projects = await Project.find({ user: req.params.userId })
      .populate("belongsToCompany", "name")
      .sort({
        createdAt: -1,
      });
    res.json({ projects });
  } catch (error) {
    console.error("Fetch projects by user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================
   GET ALL PROJECTS
===================================== */
router.get("/", auth, async (req, res) => {
  try {
    const projects = await Project.find()
      .populate("user", "name email score")
      .populate("belongsToCompany", "name")
      .sort({ createdAt: -1 });

    res.json({
      count: projects.length,
      projects,
    });
  } catch (error) {
    console.error("Fetch projects error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================
   GET PROJECT BY ID
===================================== */
router.get("/:id", auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("user", "name email role score")
      .populate("belongsToCompany", "name");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json({ project });
  } catch (error) {
    console.error("Fetch project error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================
   DELETE PROJECT
===================================== */
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const project = await Project.findById(req.params.id);

    if (!project) return res.status(404).json({ message: "Project not found" });

    // Only owner or admin
    if (project.user.toString() !== userId && role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    await project.deleteOne();
    await logAction(
      req,
      "Delete Project",
      `Project deleted: ${project.title}`
    );

    res.json({ message: "Project deleted" });

    // Background Score Refresh
    recalculateUserScore(userId).catch(err => console.error("BG Scoring Error:", err));

  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================
   UPDATE PROJECT
===================================== */
router.put("/:id", auth, async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const { title, description, repoUrl, technologies } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) return res.status(404).json({ message: "Project not found" });

    // Only owner
    if (project.user.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { belongsToCompany } = req.body;
    const oldCompanyId = project.belongsToCompany ? project.belongsToCompany.toString() : null;
    const newCompanyId = belongsToCompany || null;

    // Update fields
    project.title = title || project.title;
    project.description = description || project.description;
    project.repoUrl = repoUrl || project.repoUrl;
    project.technologies = technologies || project.technologies;

    // Handle company change
    if (newCompanyId !== oldCompanyId) {
      if (newCompanyId) {
        // Project newly assigned to a company or company changed
        const company = await User.findById(newCompanyId);
        if (company && company.role === "company") {
          const verificationToken = crypto.randomBytes(32).toString("hex");

          project.belongsToCompany = newCompanyId;
          project.status = "awaiting_company_verification";
          project.companyVerificationStatus = "pending_verification";
          project.companyVerificationToken = verificationToken;
          project.companyScore = null;
          project.companyFeedback = "";

          // Send verification email
          const student = await User.findById(userId);
          sendCompanyProjectVerificationEmail(
            company.email,
            company.name,
            student.name,
            project.title,
            project._id.toString(),
            verificationToken
          ).catch(err => console.error("Failed to send company verification email:", err));

          // Notify company in-app
          await Notification.create({
            user: company._id,
            title: "Project Verification Required",
            message: `Student ${student.name} assigned their project "${project.title}" to your company. Please verify.`,
            type: "project",
            link: "company-verifications.html"
          });
        }
      } else {
        // Company removed
        project.belongsToCompany = null;
        project.companyVerificationStatus = "not_applicable";
        project.companyVerificationToken = null;
        project.companyScore = null;
        // If it was awaiting verification, move to pending
        if (project.status === "awaiting_company_verification") {
          project.status = "pending";
        }
      }
    }

    await project.save();

    await logAction(
      req,
      "Update Project",
      `Project updated: ${project.title}`
    );

    res.json({
      message: project.status === "awaiting_company_verification"
        ? "Project updated and sent for company verification."
        : "Project updated successfully",
      project
    });

    // Background Score Refresh (only if not awaiting verification)
    if (project.status !== "awaiting_company_verification") {
      recalculateUserScore(userId).catch(err => console.error("BG Scoring Error:", err));
    }

  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================
   COMPANY VERIFICATION ROUTES
===================================== */

/**
 * @route   GET /api/projects/company/pending
 * @desc    Get projects pending verification for a company
 * @access  Private (Companies only)
 */
router.get("/company/pending", auth, async (req, res) => {
  try {
    const { id, role } = req.user;

    if (role !== "company") {
      return res.status(403).json({ message: "Only companies can access this" });
    }

    const projects = await Project.find({
      belongsToCompany: id,
      companyVerificationStatus: "pending_verification"
    })
      .populate("user", "name email avatar")
      .sort({ createdAt: -1 });

    res.json({ projects });
  } catch (error) {
    console.error("Fetch pending verifications error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   GET /api/projects/company/verified
 * @desc    Get verified projects for a company
 * @access  Private (Companies only)
 */
router.get("/company/verified", auth, async (req, res) => {
  try {
    const { id, role } = req.user;

    if (role !== "company") {
      return res.status(403).json({ message: "Only companies can access this" });
    }

    const projects = await Project.find({
      belongsToCompany: id,
      companyVerificationStatus: "verified"
    })
      .populate("user", "name email avatar score")
      .sort({ createdAt: -1 });

    res.json({ projects });
  } catch (error) {
    console.error("Fetch verified projects error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   POST /api/projects/:id/company-verify
 * @desc    Company verifies or rejects a project
 * @access  Private (Companies only, or via token)
 */
router.post("/:id/company-verify", auth, async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const { verified, feedback, score, token } = req.body;

    const project = await Project.findById(req.params.id)
      .populate("user", "name email")
      .populate("belongsToCompany", "name email");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Verify authorization: must be the company or have valid token
    const isCompanyOwner = project.belongsToCompany && project.belongsToCompany._id.toString() === userId;
    const hasValidToken = token && project.companyVerificationToken === token;

    if (!isCompanyOwner && !hasValidToken) {
      return res.status(403).json({ message: "Not authorized to verify this project" });
    }

    if (project.companyVerificationStatus !== "pending_verification") {
      return res.status(400).json({ message: "Project is not pending verification" });
    }

    // Update project based on company decision
    console.log(`[COMPANY VERIFICATION INPUT] ProjectID: ${req.params.id}, Verified: ${verified} (type: ${typeof verified}), Feedback: "${feedback}", Score: ${score}`);

    project.companyVerificationStatus = verified ? "verified" : "rejected";
    project.companyFeedback = feedback || "";
    project.companyVerificationToken = null; // Clear token after use

    if (verified) {
      // If company provided a score
      if (typeof score === "number" && score >= 0 && score <= 100) {
        project.companyScore = score;
      }
      // Move to pending for AI scoring
      project.status = "pending";
      console.log(`[COMPANY VERIFICATION] Project VERIFIED - Status set to: ${project.status}`);
    } else {
      // Rejected by company
      // NEW: Still set status to pending so it gets AI scored
      project.status = "pending";
      project.reviewerNotes = `Company rejected: ${feedback || "Project verification denied."}`;
      console.log(`[COMPANY VERIFICATION] Project REJECTED - Status set to pending for AI scoring`);
    }

    await project.save();
    console.log(`[COMPANY VERIFICATION SAVED] ProjectID: ${project._id}, Status: ${project.status}, CompanyVerificationStatus: ${project.companyVerificationStatus}`);

    // Notify the student
    await Notification.create({
      user: project.user._id,
      title: verified ? "Project Verified by Company" : "Project Rejected by Company",
      message: verified
        ? `Your project "${project.title}" has been verified by ${project.belongsToCompany.name}. AI evaluation will begin shortly.`
        : `Your project "${project.title}" was rejected by ${project.belongsToCompany.name}. Reason: ${feedback || "No reason provided."}`,
      type: verified ? "project" : "warning",
      link: "profile.html"
    });

    // Notify admins
    const admins = await User.find({ role: "admin" });
    for (const admin of admins) {
      await Notification.create({
        user: admin._id,
        title: verified ? "Company Verified Project" : "Company Rejected Project",
        message: `${project.belongsToCompany.name} has ${verified ? "verified" : "rejected"} the project "${project.title}" by ${project.user.name}.`,
        type: "project",
        link: "managesproject.html"
      });
    }

    await logAction(
      req,
      `Company ${verified ? "verified" : "rejected"} project: ${project.title}`
    );

    res.json({
      message: verified ? "Project verified successfully" : "Project rejected",
      project
    });

    // Trigger AI scoring in background (Now always triggered)
    recalculateUserScore(project.user._id.toString()).catch(err =>
      console.error("BG Scoring Error after company verification:", err)
    );

  } catch (error) {
    console.error("Company verify error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   PUT /api/projects/:id/company-score
 * @desc    Company updates score for a verified project
 * @access  Private (Companies only)
 */
router.put("/:id/company-score", auth, async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const { score, feedback } = req.body;

    if (role !== "company") {
      return res.status(403).json({ message: "Only companies can score projects" });
    }

    if (typeof score !== "number" || score < 0 || score > 100) {
      return res.status(400).json({ message: "Score must be a number between 0 and 100" });
    }

    const project = await Project.findById(req.params.id)
      .populate("user", "name email");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Verify this company owns the project
    if (!project.belongsToCompany || project.belongsToCompany.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to score this project" });
    }

    if (project.companyVerificationStatus !== "verified") {
      return res.status(400).json({ message: "Can only score verified projects" });
    }

    project.companyScore = score;
    if (feedback) {
      project.companyFeedback = feedback;
    }

    // Immediately update blended score if aiScore exists
    const currentAiScore = (project.aiScore !== undefined && project.aiScore !== null)
      ? project.aiScore
      : project.score;

    project.score = Math.round((currentAiScore * 0.5) + (score * 0.5));
    project.status = "scored";

    await project.save();

    // Notify student
    await Notification.create({
      user: project.user._id,
      title: "Company Score Received",
      message: `Your project "${project.title}" received a score of ${score}/100 from the company.`,
      type: "project",
      link: "profile.html"
    });

    await logAction(
      req,
      `Company scored project: ${project.title} - Score: ${score}`
    );

    res.json({ message: "Company score updated", project });

    // Background Score Refresh for overall user score update
    recalculateUserScore(project.user._id.toString()).catch(err =>
      console.error("BG Scoring Error after company score update:", err)
    );

  } catch (error) {
    console.error("Company score error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   GET /api/projects/verify-by-token
 * @desc    Get project info for verification page (public with token)
 * @access  Public (with valid token)
 */
router.get("/verify-by-token", async (req, res) => {
  try {
    const { token, projectId } = req.query;

    if (!token || !projectId) {
      return res.status(400).json({ message: "Token and project ID required" });
    }

    const project = await Project.findById(projectId)
      .populate("user", "name email avatar")
      .populate("belongsToCompany", "name email");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.companyVerificationToken !== token) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }

    if (project.companyVerificationStatus !== "pending_verification") {
      return res.status(400).json({ message: "Project already processed" });
    }

    res.json({
      project: {
        _id: project._id,
        title: project.title,
        description: project.description,
        repoUrl: project.repoUrl,
        technologies: project.technologies,
        student: {
          name: project.user.name,
          email: project.user.email
        },
        company: {
          name: project.belongsToCompany.name
        },
        createdAt: project.createdAt
      }
    });
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;
