import express from "express";
import Opportunity from "../models/Opportunity.js";
import auth from "../middleware/auth.js";
import Notification from "../models/Notification.js";
import { logAction } from "../utils/logAction.js";
import { sendApplicationStatusEmail } from "../utils/emailService.js";

const router = express.Router();

/*----------------------------------------
   GET FILTER OPTIONS
----------------------------------------*/
router.get("/filters", auth, async (req, res) => {
  try {
    const [types, locations, statuses] = await Promise.all([
      Opportunity.distinct("type", { isOpen: true }),
      Opportunity.distinct("location", { isOpen: true }),
      Opportunity.distinct("status", { isOpen: true })
    ]);

    res.json({
      types: types.filter(Boolean),
      locations: locations.filter(Boolean),
      statuses: statuses.filter(Boolean)
    });
  } catch (error) {
    console.error("Fetch filters error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


/*----------------------------------------
   CREATE OPPORTUNITY (Company)
----------------------------------------*/
router.post("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "company" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { title, description, requirements, type, location, deadline, status, duration, responsibilities } = req.body;

    const opportunity = await Opportunity.create({
      company: req.user.id,
      title,
      description,
      requirements,
      type,
      location,
      deadline,
      status,
      duration,
      responsibilities
    });

    res.status(201).json({ message: "Opportunity created", opportunity });
  } catch (error) {
    console.error("Opportunity creation error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const opp = await Opportunity.findById(req.params.id);
    if (!opp) return res.status(404).json({ message: "Not found" });

    // Only creator or admin
    if (opp.company?.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    await opp.deleteOne();
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/*----------------------------------------
   GET ALL OPPORTUNITIES (Students)
----------------------------------------*/
router.get("/", auth, async (req, res) => {
  try {
    const { type, field, location, status } = req.query;
    const filter = { isOpen: true };

    if (type) filter.type = type;
    if (field) filter.field = field;
    if (status) filter.status = status;
    if (location) filter.location = { $regex: location, $options: "i" }; // Case-insensitive search

    const opportunities = await Opportunity.find(filter)
      .populate("company", "name email");

    res.json({ opportunities });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/*----------------------------------------
   APPLY TO OPPORTUNITY (Student)
----------------------------------------*/
router.post("/:id/apply", auth, async (req, res) => {
  try {
    if (req.user.role !== "user") {
      return res.status(403).json({ message: "Only students can apply" });
    }

    const opportunity = await Opportunity.findById(req.params.id);

    if (!opportunity || !opportunity.isOpen) {
      return res.status(404).json({ message: "Opportunity not found or closed" });
    }

    const applied = opportunity.applications.find(
      (a) => a.student.toString() === req.user.id
    );

    if (applied) {
      return res.status(400).json({ message: "Already applied" });
    }

    opportunity.applications.push({ student: req.user.id });
    await opportunity.save();

    await logAction(
      req,
      "Apply Opportunity",
      `User applied to opportunity: ${opportunity.title}`
    );

    if (opportunity.company) {
      await Notification.create({
        user: opportunity.company,
        title: "New Application",
        message: "A student has applied to your opportunity.",
        type: "opportunity",
        link: `/opportunities/${opportunity._id}`,
      });
    }

    res.json({ message: "Applied successfully" });
  } catch (error) {
    console.error("Apply opportunity error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/*----------------------------------------
   COMPANY VIEW APPLICANTS
----------------------------------------*/
router.get("/:id/applications", auth, async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id)
      .populate("applications.student", "name email score");

    if (!opportunity) return res.status(404).json({ message: "Not found" });

    if (opportunity.company.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not your opportunity" });
    }

    res.json(opportunity.applications);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/*----------------------------------------
   GET COMPANY'S OWN OPPORTUNITIES
----------------------------------------*/
router.get("/mine", auth, async (req, res) => {
  try {
    if (req.user.role !== "company") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const opportunities = await Opportunity.find({ company: req.user.id })
      .populate("company", "name")
      .sort({ createdAt: -1 });

    res.json({ opportunities });
  } catch (error) {
    console.error("Fetch mine opportunities error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/*----------------------------------------
   COMPANY DASHBOARD STATS
----------------------------------------*/
router.get("/stats", auth, async (req, res) => {
  try {
    if (req.user.role !== "company") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const companyId = req.user.id;

    // 1) Total Opportunities
    const totalJobs = await Opportunity.countDocuments({ company: companyId });

    // 2) Total Applications
    const opportunities = await Opportunity.find({ company: companyId });
    const totalApplications = opportunities.reduce((sum, opp) => sum + opp.applications.length, 0);

    // 3) Pending Applications
    const pendingApplications = opportunities.reduce((sum, opp) => {
      const pending = opp.applications.filter(app => app.status === "pending").length;
      return sum + pending;
    }, 0);

    // 4) Recent activity (Applications)
    // Flatten and sort applications
    let allApps = [];
    opportunities.forEach(opp => {
      opp.applications.forEach(app => {
        allApps.push({
          ...app.toObject(),
          opportunityTitle: opp.title,
          opportunityId: opp._id
        });
      });
    });

    // Populate student names and projects (Wait for all)
    const User = (await import("../models/User.js")).default;
    const Project = (await import("../models/Project.js")).default;
    const recentApps = await Promise.all(
      allApps
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 10) // Show more recent apps
        .map(async (app) => {
          const student = await User.findById(app.student).select("name email score skills university major avatar scoreAnalysis");
          const projects = await Project.find({ user: app.student }).sort({ score: -1 });
          return { ...app, student: { ...student.toObject(), projects } };
        })
    );

    res.json({
      totalJobs,
      totalApplications,
      pendingApplications,
      recentApps,
      activeThisWeek: Math.floor(totalApplications * 0.7) // Mock active ratio
    });

  } catch (error) {
    console.error("Company stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


/*----------------------------------------
   UPDATE APPLICATION STATUS (Company)
----------------------------------------*/
router.put("/:opportunityId/applications/:applicationId/status", auth, async (req, res) => {
  try {
    const { status, message } = req.body;
    if (!["pending", "accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // 1) Find and Update Application
    const opportunity = await Opportunity.findById(req.params.opportunityId);
    if (!opportunity) {
      return res.status(404).json({ message: "Opportunity not found" });
    }

    // Check ownership
    if (opportunity.company?.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const application = opportunity.applications.id(req.params.applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    application.status = status;
    if (message) application.message = message;
    await opportunity.save();

    // 2) Fetch Student Details separately for Notification/Email
    const User = (await import("../models/User.js")).default;
    const student = await User.findById(application.student).select("name email");

    if (student) {
      // Platform Notification
      try {
        await Notification.create({
          user: student._id,
          title: `Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          message: message || `Your application for "${opportunity.title}" has been ${status}.`,
          type: "opportunity",
          link: "opport.html"
        });
      } catch (notifErr) {
        console.error("Notification creation failed:", notifErr);
      }

      // Email Notification
      try {
        if (student.email) {
          await sendApplicationStatusEmail(
            student.email,
            student.name,
            opportunity.title,
            status,
            message
          );
        }
      } catch (emailErr) {
        console.error("Email sending failed:", emailErr);
      }
    }

    res.json({ message: `Application ${status} successfully`, application });
  } catch (error) {
    console.error("Update application status error:", error);
    res.status(500).json({ message: "Server error", details: error.message });
  }
});

export default router;
