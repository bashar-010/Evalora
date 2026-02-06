import express from "express";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import auth from "../middleware/auth.js";
import { logAction } from "../utils/logAction.js";
import { sendTestNotificationEmail } from "../utils/emailService.js";

const router = express.Router();

/* ------------------------------------
   GET MY NOTIFICATIONS
------------------------------------- */
router.get("/", auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 });



    res.json({ count: notifications.length, notifications });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ------------------------------------
   MARK AS READ
------------------------------------- */
router.put("/:id/read", auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ------------------------------------
   MARK ALL AS READ
------------------------------------- */
router.put("/read-all", auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ------------------------------------
   DELETE NOTIFICATION
------------------------------------- */
router.delete("/:id", auth, async (req, res) => {
  try {
    await Notification.deleteOne({
      _id: req.params.id,
      user: req.user.id,
    });

    res.json({ message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ------------------------------------
   SEND TEST NOTIFICATION
------------------------------------- */
router.post("/test", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const settings = user.notificationSettings || { email: true, site: true };
    let emailSent = false;
    let siteCreated = false;

    // 1. Send Email if enabled
    if (settings.email !== false) {
      try {
        await sendTestNotificationEmail(user.email, user.name);
        emailSent = true;
      } catch (err) {
        console.error("Test email failed:", err);
      }
    }

    // 2. Create Site Notification if enabled
    if (settings.site !== false) {
      await Notification.create({
        user: user._id,
        title: "Test Notification",
        message: "This is a test notification from your settings page!",
        type: "admin",
        link: "notifications_center.html"
      });
      siteCreated = true;
    }

    res.json({
      message: "Test completed!",
      emailSent,
      siteCreated
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;