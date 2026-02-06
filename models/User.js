// models/User.js

import mongoose from "mongoose";
import jwt from "jsonwebtoken";

/* ==================================
   User Schema
================================== */
/*
  هذا الموديل يمثل أي حساب في النظام:
  - طالب
  - شركة
  - أدمن
*/
const userSchema = new mongoose.Schema(
  {

    // الاسم الكامل
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    // البريد الإلكتروني (مميز)
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    // كلمة المرور
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },

    // نوع المستخدم
    role: {
      type: String,
      enum: ["user", "company", "admin"],
      default: "user",
    },

    // Sub-role for admin/granular control
    subRole: {
      type: String,
      default: ""
    },

    // حالة الحساب
    status: {
      type: String,
      enum: ["active", "pending", "suspended"],
      default: "active",
    },

    // Is waiting for company approval
    isCompanyPending: {
      type: Boolean,
      default: false
    },

    // كود تفعيل الشركة
    companyVerificationCode: {
      type: String,
      default: null,
    },

    // Email Verification
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationCode: {
      type: String,
      default: null
    },
    emailVerificationExpires: {
      type: Date,
      default: null
    },

    // Company Details
    website: {
      type: String,
      trim: true
    },
    contactPerson: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },

    // Profile Details
    university: {
      type: String,
      default: ""
    },
    major: {
      type: String,
      default: ""
    },
    avatar: {
      type: String,
      default: "photos/default-avatar.png"
    },
    avatar: {
      type: String,
      default: "photos/default-avatar.png"
    },

    // Skills
    skills: {
      type: [String],
      default: []
    },

    // Achievements
    achievements: [
      {
        title: String,
        description: String,
        certificateUrl: String,
        date: { type: Date, default: Date.now }
      }
    ],

    // Reset Password
    resetPasswordCode: {
      type: String,
      default: null
    },
    resetPasswordExpires: {
      type: Date,
      default: null
    },

    // مجموع وتقيمة مشاريع المستخدم
    score: {
      type: Number,
      default: 0,
    },

    // AI Score Analysis
    scoreAnalysis: {
      summary: String,
      strengths: [String],
      weaknesses: [String],
      recommendations: [String]
    },
    // Notification Settings
    notificationSettings: {
      email: { type: Boolean, default: true },
      site: { type: Boolean, default: true },
      triggers: {
        newProjectEmail: { type: Boolean, default: false },
        newProjectSite: { type: Boolean, default: true },
        deadlineEmail: { type: Boolean, default: true },
        deadlineSite: { type: Boolean, default: false },
        registerEmail: { type: Boolean, default: true },
        registerSite: { type: Boolean, default: false },
        resubmitEmail: { type: Boolean, default: false },
        resubmitSite: { type: Boolean, default: true }
      }
    },

  },
  {
    timestamps: true,   // createdAt / updatedAt
  }
);

/* ==================================
   Instance Methods
================================== */
/**
 * توليد JWT خاص بهذا المستخدم
 */
userSchema.methods.generateJWT = function () {
  return jwt.sign(
    {
      id: this._id,
      role: this.role,
      status: this.status,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

export default mongoose.model("User", userSchema);