// controllers/authController.js

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import User from "../models/User.js";
import { logAction } from "../utils/logAction.js";

/* ===============================
   EMAIL CONFIGURATION (Companies)
================================ */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send activation code to company email
 */
const sendCompanyVerificationEmail = async (email, code) => {
  const message = `
Hello,

Your company activation code is:

${code}

Please send this code to support to verify your company.

Thank you.
`;

  const mailOptions = {
    from: `"Support Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Company Account Verification",
    text: message,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Activation code sent to:", email);
  } catch (error) {
    console.error("❌ Email sending failed:", error.message);
  }
};

/* ===============================
   REGISTER CONTROLLER
================================ */
export const register = async (req, res) => {
  try {
    const { name, email, password, accountType } = req.body;

    // 1) Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    // 2) Check if email already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        message: "Email already exists, please login instead",
      });
    }

    // 3) Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4) Set defaults
    let role = "user";
    let status = "active";
    let companyVerificationCode = null;

    // If account type is company
    if (accountType === "company") {
      role = "company";
      status = "pending";
      companyVerificationCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    }

    // 5) Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      status,
      companyVerificationCode,
    });

    // 6) Send activation email if company
    if (role === "company") {
      await sendCompanyVerificationEmail(email, companyVerificationCode);
    }

    await logAction(req, "Register", `Account created: ${email}`);

    // 7) Response
    res.status(201).json({
      message:
        role === "company"
          ? "Company registered. Activation code sent via email"
          : "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });

  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ===============================
   LOGIN CONTROLLER
================================ */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1) Validate
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // 2) Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // 3) Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    // 4) Company not activated
    if (user.role === "company" && user.status !== "active") {
      return res.status(403).json({
        message: "Company not activated yet",
        status: user.status,
      });
    }

    // 5) Suspended account
    if (user.status === "suspended") {
      return res.status(403).json({ message: "Account suspended" });
    }

    // 6) Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 7) Response
    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });

    await logAction(req, "Login", `User logged in: ${email}`);

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ===============================
   PROFILE CONTROLLER
================================ */
export const getProfile = async (req, res) => {
  res.json({
    message: "User profile data",
    user: req.user, // Comes from verifyToken middleware
  });
};