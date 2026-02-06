
// routes/userRoutes.js

import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { verifyToken } from "../middleware/auth.js";
import { googleLogin } from "../controllers/socialAuthController.js";
import { recalculateUserScore } from "../utils/scoringService.js";
import crypto from "crypto";
import { sendVerificationCode } from "../utils/emailService.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/* -------------------------------
       REGISTER USER / COMPANY
--------------------------------*/
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, accountType } = req.body;
    console.log(`[REGISTER ATTEMPT] Name: ${name}, Email: ${email}, AccountType: ${accountType}`);

    if (!name || !email || !password) {
      return res.status(400).json({ message: " Please enter all fields " });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: " Invalid email format " });
    }

    // Block Arabic/non-Latin characters (checking for Arabic unicode range)
    const arabicRegex = /[\u0600-\u06FF]/;
    if (arabicRegex.test(name) || arabicRegex.test(email) || arabicRegex.test(password)) {
      return res.status(400).json({ message: " Only English/Latin characters are allowed for name, email and password " });
    }

    // Validate email domain - REPLACED WITH GENERAL LOGIC
    // Simple basic check to ensure it looks like a domain, but allow any value
    const emailDomain = email.split('@')[1]?.toLowerCase();

    if (!emailDomain || !emailDomain.includes('.')) {
      return res.status(400).json({
        message: "Invalid email domain format"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: " Password must be at least 8 characters long " });
    }

    // Check if the email is used
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: " The email is already in use " });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(password, salt);

    // creat account
    const newUser = new User({
      name,
      email,
      password: hashedPass,
      // When a company registers, they start as a regular 'user' role until admin approved
      role: "user",
      status: accountType === "company" ? "pending" : "active",
      isCompanyPending: accountType === "company" ? true : false,
      ...(accountType === "company" && {
        website: req.body.website,
        contactPerson: req.body.contactPerson
      })
    });

    await newUser.save();

    // Generate verification code
    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    newUser.emailVerificationCode = verificationCode;
    newUser.emailVerificationExpires = expiresAt;
    await newUser.save();

    // Send verification email
    const { sendRegistrationVerificationEmail } = await import("../utils/emailService.js");
    try {
      await sendRegistrationVerificationEmail(email, name, verificationCode);
    } catch (emailError) {
      console.error("Verification email failed:", emailError);
      console.log(`[DEV MODE] Verification Code for ${email}: ${verificationCode}`);
    }

    // Notify all admins about new company
    if (newUser.isCompanyPending) {
      const Notification = (await import("../models/Notification.js")).default;
      const admins = await User.find({ role: "admin" });
      for (const admin of admins) {
        await Notification.create({
          user: admin._id,
          title: "New Company Registered",
          message: `A new company "${name}" has registered and is pending approval.`,
          type: "admin",
          link: "managecompanies.html"
        });
      }
    }

    res.status(201).json({
      message: "Registration successful! Please check your email for verification code.",
      email: email
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: " Server error " });
  }
});

/* -------------------------------
             LOGIN
--------------------------------*/
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`[LOGIN ATTEMPT] Email: ${email}`);

    const user = await User.findOne({ email });
    if (!user) {
      console.log(`[LOGIN FAILED] Email not found: ${email}`);
      return res.status(400).json({ message: " Email not found " });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ message: " The password is incorrect " });

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in.",
        email: user.email,
        requiresVerification: true
      });
    }

    // JWT
    const token = user.generateJWT();

    res.json({
      message: " You have been logged in successfully ",
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        status: user.status
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: " Server error " });
  }
});

/* -------------------------------
     VERIFY EMAIL
--------------------------------*/
router.post("/verify-email", async (req, res) => {
  console.log('=== VERIFY EMAIL ROUTE HIT ===');
  console.log('Request body:', req.body);

  try {
    const { email, code } = req.body;
    console.log(`Verification attempt for ${email} with code ${code}`);

    const user = await User.findOne({ email });
    if (!user) {
      console.log(`User not found: ${email}`);
      return res.status(404).json({ message: "User not found" });
    }

    console.log(`User found. Stored code: ${user.emailVerificationCode}, Expires: ${user.emailVerificationExpires}`);

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    // Check if code matches
    if (user.emailVerificationCode !== code) {
      console.log(`Code mismatch. Expected: ${user.emailVerificationCode}, Got: ${code}`);
      return res.status(400).json({ message: "Invalid verification code" });
    }

    // Check if code expired
    if (Date.now() > user.emailVerificationExpires) {
      return res.status(400).json({ message: "Verification code expired. Please request a new one." });
    }

    // Mark as verified
    user.isEmailVerified = true;
    user.emailVerificationCode = null;
    user.emailVerificationExpires = null;
    await user.save();

    console.log(`Email verified successfully for ${email}`);
    res.json({ message: "Email verified successfully! You can now login." });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------------------
     RESEND VERIFICATION CODE
--------------------------------*/
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    // Generate new code
    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    user.emailVerificationCode = verificationCode;
    user.emailVerificationExpires = expiresAt;
    await user.save();

    // Send email
    const { sendRegistrationVerificationEmail } = await import("../utils/emailService.js");
    try {
      await sendRegistrationVerificationEmail(email, user.name, verificationCode);
      res.json({ message: "Verification code resent successfully!" });
    } catch (emailError) {
      console.error("Verification email failed:", emailError);
      console.log(`[DEV MODE] Verification Code for ${email}: ${verificationCode}`);
      res.json({ message: "Code generated. Check server logs." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// =====================================
// GOOGLE LOGIN
// =====================================
/**
 * @route   POST /api/auth/google
 * @desc    Login/Register via Google
 * @access  Public
 */
router.post("/auth/google", googleLogin);

/* -------------------------------
        GET CURRENT USER (ME)
--------------------------------*/
router.get("/me", verifyToken, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "User ID missing from token" });
    }

    const user = await User.findById(userId).select("-password").lean();
    if (!user)
      return res.status(404).json({ message: " User not found " });

    res.json({ message: " Data fetched successfully ", user });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: " Server error " });
  }
});

/* -------------------------------
        GET SUGGESTED STUDENTS
--------------------------------*/
router.get("/suggested", verifyToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const currentUser = await User.findById(currentUserId);

    if (!currentUser) {
      return res.status(404).json({ message: "Current user not found" });
    }

    const myMajor = currentUser.major || "";
    const myUni = currentUser.university || "";
    const mySkills = currentUser.skills || [];

    // Aggregation Pipeline for Smart Matching
    const suggested = await User.aggregate([
      {
        $match: {
          _id: { $ne: currentUser._id }, // Not me
          role: "user",                  // Only students
          status: "active"               // Only active accounts
        }
      },
      {
        $addFields: {
          // Calculate Match Score
          matchScore: {
            $add: [
              // +10 points for same Major
              {
                $cond: [
                  { $and: [{ $ne: ["$major", ""] }, { $eq: ["$major", myMajor] }] },
                  10,
                  0
                ]
              },
              // +5 points for same University
              {
                $cond: [
                  { $and: [{ $ne: ["$university", ""] }, { $eq: ["$university", myUni] }] },
                  5,
                  0
                ]
              },
              // +2 points for each shared skill
              {
                $multiply: [
                  { $size: { $setIntersection: ["$skills", mySkills] } },
                  2
                ]
              }
            ]
          }
        }
      },
      { $sort: { matchScore: -1, _id: 1 } }, // Sort by score DESC, then ID for consistency
      { $limit: 5 },                         // Top 5 matches
      {
        $project: {
          name: 1,
          avatar: 1,
          major: 1,
          university: 1,
          matchScore: 1 // Optional: return score if frontend wants to show "90% match"
        }
      }
    ]);

    // Format for frontend
    const processed = suggested.map(user => ({
      ...user,
      avatar: user.avatar || 'photos/default-avatar.png'
    }));

    res.json({ users: processed });

  } catch (error) {
    console.error("Suggested students error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------------------
        GET USER BY ID
--------------------------------*/
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user)
      return res.status(404).json({ message: " User not found " });

    res.json({ message: " Data fetched successfully ", user });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: " Server error " });
  }
});

/* -------------------------------
    GET ACTIVE COMPANIES (PUBLIC)
--------------------------------*/
router.get("/companies/list", verifyToken, async (req, res) => {
  try {
    // Fetch all active companies (role=company, status=active)
    const companies = await User.find({
      role: "company",
      status: "active"
    })
      .select("name email _id") // Only return necessary fields
      .lean();

    res.json({ companies });

  } catch (error) {
    console.error("Get companies error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------------------
       UPDATE PROFILE
--------------------------------*/
router.put("/me", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email } = req.body;

    const denied = ["role", "status", "score", "password", "companyVerificationCode"];
    for (let key of denied) {
      if (req.body[key]) {
        return res.status(400).json({ message: `Editing this field is not allowe ${key}` });
      }
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      {
        name,
        email,
        ...(req.body.skills && { skills: req.body.skills }),
        ...(req.body.university !== undefined && { university: req.body.university }),
        ...(req.body.major !== undefined && { major: req.body.major }),
        ...(req.body.avatar !== undefined && { avatar: req.body.avatar }),
        ...(req.body.notificationSettings !== undefined && { notificationSettings: req.body.notificationSettings })
      },
      { new: true }
    ).select("-password");


    res.json({ message: " The account has been updated successfully ", user: updated });

    // Background Score Refresh if skills changed
    if (req.body.skills) {
      recalculateUserScore(userId, { skills: req.body.skills }).catch(err => console.error("BG Scoring Error:", err));
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: " Server error " });
  }
});

/* -------------------------------
       ADD ACHIEVEMENT
--------------------------------*/
router.post("/me/achievements", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, certificateUrl } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Achievement title is required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.achievements.push({ title, description, certificateUrl });
    await user.save();


    res.json({ message: "Achievement added", achievements: user.achievements });

    // Background Score Refresh
    recalculateUserScore(userId).catch(err => console.error("BG Scoring Error:", err));

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------------------
        DELETE ACHIEVEMENT
--------------------------------*/
router.delete("/me/achievements/:id", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.achievements = user.achievements.filter(ach => ach._id.toString() !== req.params.id);
    await user.save();


    res.json({ message: "Achievement deleted", achievements: user.achievements });

    // Background Score Refresh
    recalculateUserScore(userId).catch(err => console.error("BG Scoring Error:", err));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------------------
        UPDATE ACHIEVEMENT
--------------------------------*/
router.put("/me/achievements/:id", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, certificateUrl } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const achievement = user.achievements.id(req.params.id);
    if (!achievement) return res.status(404).json({ message: "Achievement not found" });

    achievement.title = title || achievement.title;
    achievement.description = description || achievement.description;
    achievement.certificateUrl = certificateUrl || achievement.certificateUrl;

    await user.save();

    res.json({ message: "Achievement updated", achievements: user.achievements });

    // Background Score Refresh
    recalculateUserScore(userId).catch(err => console.error("BG Scoring Error:", err));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});



/* -------------------------------
         CHANGE PASSWORD
--------------------------------*/
router.put("/change-password", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ message: " User not found " });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ message: " The old password is incorrect " });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();
    res.json({ message: " The password has been successfully changed " });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: " Server error " });
  }
});

/* -------------------------------
         DELETE ACCOUNT
--------------------------------*/
router.delete("/me", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    await User.findByIdAndDelete(userId);
    res.json({ message: " The account has been successfully deleted " });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: " Server error " });
  }
});

/* -------------------------------
         FORGOT PASSWORD
--------------------------------*/
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiration (e.g., 10 minutes)
    const expiresAt = Date.now() + 10 * 60 * 1000;

    user.resetPasswordCode = code;
    user.resetPasswordExpires = expiresAt;
    await user.save();

    // Send email
    try {
      await sendVerificationCode(email, code);
      res.json({ message: "Reset code sent on your email" });
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      console.log("---------------------------------------------------");
      console.log(`[DEV MODE] Password Reset Code for ${email}: ${code}`);
      console.log("---------------------------------------------------");

      // Return success anyway for development purposes
      res.json({ message: "Reset code logged to console (Email failed)" });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------------------
         VERIFY CODE
--------------------------------*/
router.post("/verify-code", async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.resetPasswordCode !== code || Date.now() > user.resetPasswordExpires) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    res.json({ message: "Code verified successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------------------
         RESET PASSWORD
--------------------------------*/
router.post("/reset-password", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.resetPasswordCode !== code || Date.now() > user.resetPasswordExpires) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Clear code fields
    user.resetPasswordCode = null;
    user.resetPasswordExpires = null;

    await user.save();

    res.json({ message: "Password reset successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


/* -------------------------------
     MULTER CONFIG FOR PHOTOS
--------------------------------*/
// Ensure photos directory exists
const uploadDir = path.join(__dirname, '../Evalora/photos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: user-id-timestamp.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'avatar-' + uniqueSuffix + ext);
  }
});

// File Filter
const fileFilter = (req, file, cb) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (validTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

/* -------------------------------
     UPLOAD AVATAR ROUTE
--------------------------------*/
router.post("/upload-avatar", verifyToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return relative path for frontend
    const avatarUrl = `photos/${req.file.filename}`;

    // Update user profile
    user.avatar = avatarUrl; // Assuming your User model has an 'avatar' field. If not, we might need to add it or use a generic field.
    // If User model doesn't have 'avatar', let's check or add it.
    // For now, I'll assume we can save it. If schema is strict, we might need to update schema first.

    // Wait, let's just update the schema to be safe in the next step if needed.
    // But usually flexible schemas or "additional info" handles this.
    // Let's check User model first? No, let's just try to save.

    // Actually, let's store it properly.
    // If the user already had a custom avatar (not default), maybe delete the old file?
    // Optional optimization for later.

    user.profilePicture = avatarUrl; // Some systems use profilePicture
    // Let's stick to adding a new field 'avatar' to User model schema if not exists.

    await user.save();

    res.json({
      message: "Avatar uploaded successfully",
      avatarUrl: avatarUrl
    });

  } catch (error) {
    console.error("Avatar upload error:", error);
    res.status(500).json({ message: "Failed to upload avatar" });
  }
});

/* -------------------------------
     DELETE AVATAR ROUTE
--------------------------------*/
router.post("/delete-avatar", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Optional: Delete old file if it's not the default one
    // if (user.avatar && !user.avatar.includes('default-avatar')) {
    //     const oldPath = path.join(__dirname, '../Evalora', user.avatar);
    //     if (fs.existsSync(oldPath)) {
    //         fs.unlinkSync(oldPath);
    //     }
    // }

    // Reset to default
    user.avatar = "photos/default-avatar.png";
    await user.save();

    res.json({ message: "Avatar reset to default successfully" });

  } catch (error) {
    console.error("Avatar delete error:", error);
    res.status(500).json({ message: "Failed to reset avatar" });
  }
});

export default router;

