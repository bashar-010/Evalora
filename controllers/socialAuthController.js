// controllers/socialAuthController.js

import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

// REMOVED top-level initialization to prevent hoisting issues with dotenv
// const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/* =========================================
   GOOGLE LOGIN CONTROLLER
========================================= */
/**
 * @route   POST /api/auth/google
 * @desc    Login/Register using Google account
 * @access  Public
 *
 * الفرونت يرسل:
 * { token: "GOOGLE_ID_TOKEN" }
 */
export const googleLogin = async (req, res) => {
  try {
    console.log("=== Google Login Controller Hit ===");
    const { token } = req.body; // هذا هو ID Token القادم من جوجل

    if (!token) {
      console.log("Error: No token provided");
      return res.status(400).json({ message: "Google token is required" });
    }

    // Initialize client here to ensure env vars are loaded
    const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    // 1) نتحقق من التوكن عند جوجل نفسها
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    console.log("Google Payload:", payload.email, payload.name);

    // 2) نطلع البيانات المهمة من حساب جوجل
    const email = payload.email;
    const name = payload.name || payload.given_name || "Google User";

    if (!email) {
      return res.status(400).json({ message: "Google account has no email" });
    }

    // 3) نبحث إذا في يوزر بهذا الإيميل أصلاً
    let user = await User.findOne({ email });

    // 4) إذا ما في → ننشئ واحد جديد كطالب عادي
    if (!user) {
      console.log("Creating new user from Google...");
      user = await User.create({
        name,
        email,
        // كلمة المرور هنا شكلية فقط، لأنه ما رح يستخدمها (الدخول عن طريق جوجل)
        password: "google_oauth_account",
        role: "user",
        status: "active",
      });
    } else {
      console.log("User found:", user._id);
    }

    // 5) ننشئ JWT زي اللوجن العادي
    const tokenJWT = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 6) نرجع رد موحد للفرونت
    return res.json({
      message: "Logged in with Google successfully",
      token: tokenJWT,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Google Login Error:", error);
    return res.status(500).json({ message: "Server error: " + error.message });
  }
};