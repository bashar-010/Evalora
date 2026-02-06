// models/Post.js

import mongoose from "mongoose";

/* =============================
   Comment Schema
============================= */
/**
 * يمثل تعليق على منشور
 * كل تعليق مربوط بمستخدم
 */
const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",     // رابط على جدول المستخدمين
      required: true,
    },
    text: {
      type: String,
      required: true, // ممنوع تعليق فاضي
      trim: true,
    },
  },
  {
    timestamps: true, // وقت إنشاء التعلق
  }
);


/* =============================
   Post Schema
============================= */
/**
 * يمثل منشور في النظام (مثل LinkedIn post)
 */
const postSchema = new mongoose.Schema(
  {
    // صاحب المنشور
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // نص البوست
    text: {
      type: String,
      required: true,
      trim: true,
    },

    // صورة اختيارية
    image: {
      type: String,
      default: null,
    },

    // عدد اللايكات (IDs المستخدمين)
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // التعليقات
    comments: [commentSchema],
  },
  {
    timestamps: true, // createdAt / updatedAt
  }
);

export default mongoose.model("Post", postSchema);