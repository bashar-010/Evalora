// models/Project.js
import mongoose from "mongoose";

/* ==================================
   Project Schema
================================== */
/*
  هذا الجدول يمثل مشاريع الطلاب
  كل مشروع مربوط بمستخدم واحد
*/
const projectSchema = new mongoose.Schema(
  {

    // صاحب المشروع
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",      // علاقة مع جدول المستخدمين
      required: true,
    },

    // عنوان المشروع
    title: {
      type: String,
      required: [true, "Project title is required"],
      trim: true,
    },

    // وصف المشروع
    description: {
      type: String,
      trim: true,
    },

    // رابط GitHub أو الموقع
    repoUrl: {
      type: String,
      trim: true,
    },

    // التقنيات المستخدمة
    technologies: [
      {
        type: String,
        trim: true,
      },
    ],

    // تقييم الذكاء الاصطناعي
    score: {
      type: Number,
      default: 0,
    },

    // Raw AI evaluation (before blending)
    aiScore: {
      type: Number,
      default: 0,
    },

    // هل تم التقييم يدوياً من الأدمن؟
    isManualScore: {
      type: Boolean,
      default: false,
    },

    // JSON كامل قادم من AI
    aiDetails: {
      type: Object,
      default: null,
    },

    // حالة المشروع
    status: {
      type: String,
      enum: ["pending", "scored", "rejected", "Rejected", "Approved", "Needs Change", "awaiting_company_verification"],
      default: "pending",
    },

    // ملاحظات المراجع
    reviewerNotes: {
      type: String,
      trim: true,
    },

    // ===============================
    // Company Verification Fields
    // ===============================

    // Company this project belongs to (optional)
    belongsToCompany: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Company verification status
    companyVerificationStatus: {
      type: String,
      enum: ["not_applicable", "pending_verification", "verified", "rejected"],
      default: "not_applicable",
    },

    // Company's feedback on the project
    companyFeedback: {
      type: String,
      trim: true,
    },

    // Company's score (if they choose to score it)
    companyScore: {
      type: Number,
      default: null,
    },

    // Verification token for company email link
    companyVerificationToken: {
      type: String,
      default: null,
    },

  },
  {
    timestamps: true, // createdAt / updatedAt
  }
);

export default mongoose.model("Project", projectSchema);