import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import Project from "../models/Project.js";
import Notification from "../models/Notification.js";
import Opportunity from "../models/Opportunity.js";
import { verifyToken, requireAdmin } from "../middleware/auth.js";
import { logAction } from "../utils/logAction.js";
import { recalculateUserScore } from "../utils/scoringService.js";

const router = express.Router();

/* -------------------------------
        GET ALL USERS
--------------------------------*/
router.get("/users", verifyToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: "user", isCompanyPending: false }).select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------------------
        GET ALL COMPANIES
--------------------------------*/
router.get("/companies", verifyToken, requireAdmin, async (req, res) => {
  try {
    const companies = await User.find({
      $or: [
        { role: "company" },
        { isCompanyPending: true }
      ]
    }).select("-password");
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/companies", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, password, website, contactPerson } = req.body;

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    const bcrypt = await import("bcryptjs");
    const salt = await bcrypt.default.genSalt(10);
    const hashedPassword = await bcrypt.default.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashedPassword,
      role: "company",
      status: "active",
      website,
      contactPerson
    });

    await user.save();

    await logAction(req, "Admin Create Company", `Created company: ${user.name} (${user.email})`);

    res.status(201).json({ message: "Company created successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------------------
         DELETE USER
--------------------------------*/
router.delete("/users/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const userInfo = user ? `${user.name} (${user.email})` : req.params.id;
    await User.findByIdAndDelete(req.params.id);

    await logAction(req, "Admin Delete User", `Deleted user: ${userInfo}`);

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------------------
      UPDATE USER
--------------------------------*/
router.put("/users/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).select("-password");

    await logAction(req, "Admin Update User", `Updated user: ${updated.name} (${updated.email})`);

    res.json({ message: "User updated", updated });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------------------
        ACTIVATE COMPANY
--------------------------------*/
router.put("/company/activate/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      {
        status: "active",
        role: "company",
        isCompanyPending: false
      },
      { new: true }
    ).select("-password");

    await Notification.create({
      user: updated._id,
      title: "Company Activated",
      message: "Your company account has been approved by admin.",
      type: "admin",
    });

    await logAction(req, "Company Activated", `Company: ${updated.name} (${updated.email})`);

    res.json({ message: "Company activated", updated });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------------------
       DEACTIVATE COMPANY
--------------------------------*/
router.put("/company/deactivate/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { status: "pending" },
      { new: true }
    ).select("-password");

    await Notification.create({
      user: updated._id,
      title: "Company Deactivated",
      message: "Your company account has been deactivated by admin.",
      type: "admin",
    });

    await logAction(req, "Company Deactivated", `Company: ${updated.name} (${updated.email})`);

    res.json({ message: "Company deactivated", updated });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------------------
         DELETE COMPANY
--------------------------------*/
router.delete("/company/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const company = await User.findById(req.params.id);
    const companyInfo = company ? `${company.name} (${company.email})` : req.params.id;
    await User.findByIdAndDelete(req.params.id);

    await logAction(req, "Delete Company", `Company deleted: ${companyInfo}`);

    res.json({ message: "Company deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------------------
         GET ALL PROJECTS
--------------------------------*/
router.get("/projects", verifyToken, requireAdmin, async (req, res) => {
  try {
    const projects = await Project.find()
      .populate("user", "name email score")
      .sort({ createdAt: -1 });

    res.json({ projects });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------------------
         DELETE PROJECT
--------------------------------*/
router.delete("/projects/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    await project.deleteOne();

    await logAction(req, "Delete Project", `Project: ${project.title}`);

    res.json({ message: "Project deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------------------
         UPDATE PROJECT STATUS
--------------------------------*/
router.put("/projects/:id/status", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pending", "scored", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    project.status = status;
    await project.save();

    await logAction(req, "Project Status Change", `Project "${project.title}" status changed to ${status}`);

    res.json({ message: "Project status updated", project });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------------------
         UPDATE PROJECT SCORE
--------------------------------*/
router.put("/projects/:id/score", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { score } = req.body;

    if (typeof score !== "number") {
      return res.status(400).json({ message: "Score must be number" });
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    project.score = score;
    project.status = "scored";
    project.isManualScore = true;
    await project.save();

    const projects = await Project.find({ user: project.user });
    const total = projects.reduce((sum, p) => sum + (p.score || 0), 0);
    const avg = projects.length ? Math.round(total / projects.length) : 0;

    await User.findByIdAndUpdate(project.user, { score: avg });

    await logAction(req, "Manual Score Update", `Project "${project.title}" score updated to ${score}`);

    res.json({ message: "Score updated", project });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------------------
         PROJECT STATUS UPDATE
--------------------------------*/
router.put("/project/:id/status", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { status, notes, score } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (status) project.status = status;
    if (notes !== undefined) project.reviewerNotes = notes;
    if (score !== undefined) {
      project.score = score;
      project.isManualScore = true;
    }

    await project.save();

    // If score was updated, recalculate user's overall score using official logic
    if (score !== undefined) {
      try {
        await recalculateUserScore(project.user);
      } catch (err) {
        console.error("Error recalculating score in admin route:", err);
        // Fallback or just ignore if it's not critical
      }
    }

    await Notification.create({
      user: project.user,
      title: "Project Update",
      message: `Your project "${project.title}" status has been updated to: ${status}${score !== undefined ? ` with score ${score}%` : ""}`,
      type: "project",
    });

    await logAction(req, "Project Status Update", `Project "${project.title}" updated to ${status}${score !== undefined ? ` (Score: ${score})` : ""}`);

    res.json({ message: "Project updated successfully", project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------------------
    ADMIN COMPANY VERIFICATION OVERRIDE
--------------------------------*/
router.put("/project/:id/company-override", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { verificationStatus, feedback, score } = req.body;
    const project = await Project.findById(req.params.id)
      .populate("user", "name email")
      .populate("belongsToCompany", "name");

    if (!project) return res.status(404).json({ message: "Project not found" });

    if (!project.belongsToCompany) {
      return res.status(400).json({ message: "This project is not associated with a company" });
    }

    // Validate verification status
    if (!["verified", "rejected"].includes(verificationStatus)) {
      return res.status(400).json({ message: "Invalid verification status. Use 'verified' or 'rejected'" });
    }

    // Update company verification status
    project.companyVerificationStatus = verificationStatus;
    project.companyFeedback = feedback || `Admin override: ${verificationStatus}`;
    project.companyVerificationToken = null;

    if (verificationStatus === "verified") {
      if (typeof score === "number" && score >= 0 && score <= 100) {
        project.companyScore = score;
      }
      project.status = "pending"; // Ready for AI scoring
    } else {
      project.status = "rejected";
      project.reviewerNotes = `Admin rejected company association: ${feedback || "No reason provided."}`;
    }

    await project.save();

    // Notify student
    await Notification.create({
      user: project.user._id,
      title: verificationStatus === "verified" ? "Project Company Association Approved" : "Project Company Association Rejected",
      message: verificationStatus === "verified"
        ? `Your project "${project.title}" company association with ${project.belongsToCompany.name} has been approved by admin. AI evaluation will begin shortly.`
        : `Your project "${project.title}" company association was rejected by admin. Reason: ${feedback || "No reason provided."}`,
      type: verificationStatus === "verified" ? "project" : "warning",
      link: "profile.html"
    });

    // If project belongs to a company, notify them too
    if (project.belongsToCompany) {
      await Notification.create({
        user: project.belongsToCompany._id,
        title: "Admin Override: Project Verification",
        message: `Admin has ${verificationStatus} the project "${project.title}" by ${project.user.name}.`,
        type: "admin",
        link: "company-verifications.html"
      });
    }

    await logAction(req, "Admin Company Override", `Admin ${verificationStatus} company verification for "${project.title}"`);

    res.json({ message: `Company verification ${verificationStatus} by admin`, project });

    // Trigger AI scoring if verified
    if (verificationStatus === "verified") {
      recalculateUserScore(project.user._id.toString()).catch(err =>
        console.error("BG Scoring Error after admin override:", err)
      );
    }
  } catch (error) {
    console.error("Admin company override error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------------------
         ADMIN MANAGEMENT
--------------------------------*/
router.get("/admins", verifyToken, requireAdmin, async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" }).select("-password");
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/admins", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, password, subRole, status } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    const bcrypt = await import("bcryptjs");
    const salt = await bcrypt.default.genSalt(10);
    const hashedPassword = await bcrypt.default.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashedPassword,
      role: subRole === "admin" || subRole === "user" || subRole === "company" ? subRole : "admin",
      subRole: subRole || "admin",
      status: status || "active"
    });

    await user.save();

    await logAction(req, "Admin Create Admin", `Created admin: ${user.email} with role ${subRole}`);

    res.status(201).json({ message: "Admin created", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/admins/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, subRole, status } = req.body;
    const updateData = { name, email, subRole, status };
    if (subRole === "admin" || subRole === "user" || subRole === "company") {
      updateData.role = subRole;
    }

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select("-password");

    await logAction(req, "Admin Update Admin", `Updated admin: ${updated.name} (${updated.email})`);

    res.json({ message: "Admin updated", updated });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/admins/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const admin = await User.findById(req.params.id);
    const adminInfo = admin ? `${admin.name} (${admin.email})` : req.params.id;
    await User.findByIdAndDelete(req.params.id);

    await logAction(req, "Admin Delete Admin", `Deleted admin: ${adminInfo}`);

    res.json({ message: "Admin deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------------------
         AUDIT LOGS
--------------------------------*/
router.get("/logs", verifyToken, requireAdmin, async (req, res) => {
  try {
    const Log = (await import("../models/Log.js")).default;
    const logs = await Log.find()
      .populate("user", "name role")
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(logs);
  } catch (error) {
    console.error("Fetch logs error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------------------
         GET DASHBOARD STATS
--------------------------------*/
router.get("/stats", verifyToken, requireAdmin, async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: "user", isCompanyPending: false });
    const totalCompanies = await User.countDocuments({
      $or: [{ role: "company" }, { isCompanyPending: true }]
    });
    const totalProjects = await Project.countDocuments();
    const totalOpportunities = await Opportunity.countDocuments();

    // Line Chart Data: Registrations over the last 6 months
    const lineChartData = {
      labels: [],
      values: []
    };

    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('en-US', { month: 'short' });
      lineChartData.labels.push(label);

      // Cumulative students up to the end of that month
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const count = await User.countDocuments({
        role: "user",
        createdAt: { $lte: endOfMonth }
      });
      lineChartData.values.push(count);
    }

    // Pie Chart Data: Real Major Distribution (Top 3)
    const majorStats = await User.aggregate([
      { $match: { role: "user", major: { $exists: true, $ne: "" } } },
      { $group: { _id: "$major", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]);

    const pieChartData = majorStats.map(stat => ({
      label: stat._id.toUpperCase(),
      value: stat.count
    }));

    // Fill with placeholders if no data at all
    if (pieChartData.length === 0) {
      pieChartData.push({ label: 'No Data', value: 1 });
    }

    res.json({
      totalStudents,
      totalCompanies,
      totalProjects,
      totalOpportunities,
      activeThisWeek: Math.floor(totalStudents * 0.4),
      lineChartData,
      pieChartData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;