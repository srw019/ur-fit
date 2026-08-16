/**
 * User.js
 * -------
 * Mongoose model for users in the UR Fit backend.
 */

const mongoose = require("mongoose")

// Define the schema for a user
const UserSchema = new mongoose.Schema(
  {
    // User's name (required)
    name: { type: String, required: true },
    // User's email (required, unique)
    email: { type: String, required: true, unique: true },
    // Hashed password (required)
    password: { type: String, required: true },
    // User role: participant or coordinator (required)
    role: {
      type: String,
      enum: ["participant", "coordinator"],
      required: true,
    },
    // Array of joined challenge IDs (references Challenge model)
    joinedChallenges: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Challenge",
      },
    ],
    // Total points earned across challenges
    totalPoints: {
      type: Number,
      default: 0,
    },
    // Simple in-app notifications for the user
    notifications: {
      type: [
        {
          type: { type: String },
          payload: { type: mongoose.Schema.Types.Mixed },
          status: { type: String, enum: ["unread", "read"], default: "unread" },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true } // Automatically add createdAt and updatedAt fields
)

module.exports = mongoose.model("User", UserSchema)
