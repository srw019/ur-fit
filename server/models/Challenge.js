/**
 * Challenge.js
 * ------------
 * Mongoose model for wellness challenges in the UR Fit backend.
 */

const mongoose = require("mongoose")

// Define the schema for a wellness challenge
const challengeSchema = new mongoose.Schema(
  {
    // Challenge title (required)
    title: {
      type: String,
      required: true,
    },
    // Short description (required)
    description: {
      type: String,
      required: true,
    },
    // Points awarded for each daily activity log
    pointsPerLog: {
      type: Number,
      default: 0,
    },
    // Detailed/long description (optional)
    longDescription: {
      type: String,
    },
    // Challenge start date (required)
    startDate: {
      type: Date,
      required: true,
    },
    // Challenge end date (required)
    endDate: {
      type: Date,
      required: true,
    },
    // Array of participant user IDs (references User model)
    participants: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },
    // Invitations sent to users (pending/accepted/rejected)
    invitations: {
      type: [
        {
          user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
          invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          invitedAt: { type: Date, default: Date.now },
          respondedAt: { type: Date },
          responseMessage: { type: String },
        },
      ],
      default: [],
    },
    // Cached count of participants
    participantCount: {
      type: Number,
      default: 0,
    },
    // Image URL for the challenge
    imageUrl: {
      type: String,
    },
    // Array of external resource links
    externalLink: {
      type: [
        {
          type: String,
        },
      ],
      default: [],
    },
    // Array of PDF resource URLs
    pdfs: {
      type: [
        {
          type: String,
        },
      ],
      default: [],
    },
  },
  { timestamps: true } // Automatically add createdAt and updatedAt fields
)

module.exports = mongoose.model("Challenge", challengeSchema)