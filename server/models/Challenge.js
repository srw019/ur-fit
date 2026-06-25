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
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
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
    externalLink: [
      {
        type: String,
      },
    ],
    // Array of PDF resource URLs
    pdfs: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true } // Automatically add createdAt and updatedAt fields
)

module.exports = mongoose.model("Challenge", challengeSchema)