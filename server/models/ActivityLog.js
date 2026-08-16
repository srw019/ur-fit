const mongoose = require("mongoose")

const activityLogSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    challenge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Challenge",
      required: true,
    },
    activityValue: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
    },
    pointsEarned: {
      type: Number,
      required: true,
      default: 0,
    },
    logDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
)

activityLogSchema.index(
  { student: 1, challenge: 1, logDate: 1 },
  { unique: true }
)

module.exports = mongoose.model("ActivityLog", activityLogSchema)
