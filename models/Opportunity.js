import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending"
    },
    message: {
      type: String
    }
  },
  { timestamps: true }
);

const opportunitySchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false
    },

    title: {
      type: String,
      required: true
    },

    description: {
      type: String,
      required: true
    },

    type: {
      type: String,
      default: "Internship"
    },

    location: {
      type: String,
      default: "Remote"
    },

    duration: {
      type: String,
      default: "3 Months"
    },


    deadline: {
      type: Date
    },

    status: {
      type: String,
      default: "ON-SITE"
    },

    field: {
      type: String,
      enum: ["Web Dev", "AI", "Networking", "Other"],
      default: "Other"
    },

    requirements: [String],

    responsibilities: [String],

    isOpen: {
      type: Boolean,
      default: true
    },

    applications: [applicationSchema]
  },
  { timestamps: true }
);

export default mongoose.model("Opportunity", opportunitySchema);