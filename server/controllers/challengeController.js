/**
 * challengeController.js
 * ----------------------
 * Logic for challenge creation, editing, joining, and lookup.
 */

const mongoose = require("mongoose")
const Challenge = require("../models/Challenge")
const User = require("../models/User")
const ActivityLog = require("../models/ActivityLog")

// Helper function to parse YYYY-MM-DD string as local date (not UTC)
const parseLocalDate = (dateString) => {
  if (!dateString) return null
  // Extract just the date part (YYYY-MM-DD) from ISO string if needed
  const datePart = dateString.split('T')[0]
  const [year, month, day] = datePart.split('-').map(Number)
  return new Date(year, month - 1, day)
}

// Helper function to get today's date at midnight local time
const getTodayLocal = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

// Create a new challenge
exports.createChallenge = async (req, res) => {
  const {
    title,
    description,
    longDescription,
    startDate,
    endDate,
    imageUrl,
    externalLink,
    pdfs,
    pointsPerLog,
  } = req.body

  try {
    // Validate required fields
    if (!title || !description || !startDate || !endDate) {
      return res
        .status(400)
        .json({
          message:
            "Title, description, startDate, and endDate are required",
        })
    }

    // Parse dates as local dates (not UTC)
    const today = getTodayLocal()
    const start = parseLocalDate(startDate)
    const end = parseLocalDate(endDate)

    if (!start || !end) {
      return res.status(400).json({ message: "Invalid date format" })
    }

    // Validate that startDate is not before today
    if (start < today) {
      return res
        .status(400)
        .json({ message: "Start date cannot be before today" })
    }

    // Validate that endDate is after startDate
    if (end <= start) {
      return res
        .status(400)
        .json({ message: "End date must be after start date" })
    }

    const pointsPerLogValue =
      pointsPerLog !== undefined ? Number(pointsPerLog) : 0

    if (pointsPerLog !== undefined && isNaN(pointsPerLogValue)) {
      return res.status(400).json({ message: "pointsPerLog must be a number" })
    }
    if (pointsPerLogValue < 0) {
      return res.status(400).json({ message: "pointsPerLog cannot be negative" })
    }

    const challenge = new Challenge({
      title,
      description,
      longDescription,
      startDate: start,
      endDate: end,
      imageUrl,
      externalLink,
      pdfs,
      pointsPerLog: pointsPerLogValue,
    })

    await challenge.save()
    res
      .status(201)
      .json({ message: "Challenge created successfully", challenge })
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message })
  }
}

// Get all challenges
exports.getChallenges = async (req, res) => {
  try {
    const challenges = await Challenge.find().populate(
      "participants",
      "name email"
    )
    res.status(200).json(challenges)
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message })
  }
}

// Get a challenge by its ID
exports.getChallengeById = async (req, res) => {
  const { id } = req.params

  try {
    const challenge = await Challenge.findById(id).populate(
      "participants",
      "name email"
    )
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" })
    }
    res.status(200).json(challenge)
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message })
  }
}

// Participant joins a challenge
exports.joinChallenge = async (req, res) => {
  const challengeId = req.params.id
  const userId = req.user.userId

  try {
    const challenge = await Challenge.findById(challengeId)
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" })
    }

    // Prevent duplicate join
    if (challenge.participants.includes(userId)) {
      return res.status(400).json({ message: "Already joined this challenge" })
    }

    challenge.participants.push(userId)
    challenge.participantCount = challenge.participants.length
    await challenge.save()

    // Add challenge to user's joinedChallenges
    await User.findByIdAndUpdate(userId, {
      $addToSet: { joinedChallenges: challengeId },
    })

    res
      .status(200)
      .json({ message: "Joined challenge successfully", challenge })
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message })
  }
}

// Get all challenges joined by the current user
exports.getUserJoinedChallenges = async (req, res) => {
  const userId = req.user.userId

  try {
    const user = await User.findById(userId).populate("joinedChallenges")
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }
    res.status(200).json(user.joinedChallenges)
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message })
  }
}

// Coordinator enrolls a user in a challenge
exports.userEnrollment = async (req, res) => {
  try {
    if (req.user.role !== "coordinator") {
      return res.status(403).json({ message: "Access denied" })
    }

    const { userId, challengeId } = req.body

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const challenge = await Challenge.findById(challengeId)
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" })
    }

    // Prevent duplicate enrollment
    if (challenge.participants.includes(userId)) {
      return res
        .status(400)
        .json({ message: "User already enrolled in this challenge" })
    }

    challenge.participants.push(userId)
    challenge.participantCount = challenge.participants.length
    await challenge.save()

    user.joinedChallenges.push(challengeId)
    await user.save()

    res.json({ message: "User enrolled in challenge successfully" })
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message })
  }
}

// Add a new external link to a challenge
exports.addChallengeLink = async (req, res) => {
  const { id } = req.params;
  const { link } = req.body;

  try {
    const challenge = await Challenge.findByIdAndUpdate(
      id,
      { $push: { externalLink: link } },
      { new: true }
    );
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }
    res.status(200).json({ message: "Link added successfully", challenge });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update a single external link by index
exports.updateSingleChallengeLink = async (req, res) => {
  const { id } = req.params;
  const { index, newLink } = req.body; 

  try {
    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }
    if (
      !Array.isArray(challenge.externalLink) ||
      index < 0 ||
      index >= challenge.externalLink.length
    ) {
      return res.status(400).json({ message: "Invalid link index" });
    }
    challenge.externalLink[index] = newLink;
    await challenge.save();
    res.status(200).json({ message: "Link updated successfully", challenge });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Add a new PDF resource to a challenge
exports.addChallengePdf = async (req, res) => {
  const { id } = req.params;
  const { pdf } = req.body;

  try {
    const challenge = await Challenge.findByIdAndUpdate(
      id,
      { $push: { pdfs: pdf } },
      { new: true }
    );
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }
    res.status(200).json({ message: "PDF added successfully", challenge });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update a single PDF resource by index
exports.updateSingleChallengePdf = async (req, res) => {
  const { id } = req.params;
  const { index, newPdf } = req.body; 

  try {
    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }
    if (
      !Array.isArray(challenge.pdfs) ||
      index < 0 ||
      index >= challenge.pdfs.length
    ) {
      return res.status(400).json({ message: "Invalid PDF index" });
    }
    challenge.pdfs[index] = newPdf;
    await challenge.save();
    res.status(200).json({ message: "PDF updated successfully", challenge });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Delete a single link by index
exports.deleteSingleChallengeLink = async (req, res) => {
  const { id } = req.params;
  const { index } = req.body;

  try {
    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }
    if (
      !Array.isArray(challenge.externalLink) ||
      index < 0 ||
      index >= challenge.externalLink.length
    ) {
      return res.status(400).json({ message: "Invalid link index" });
    }
    challenge.externalLink.splice(index, 1);
    await challenge.save();
    res.status(200).json({ message: "Link deleted successfully", challenge });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Delete a single PDF by index
exports.deleteSingleChallengePdf = async (req, res) => {
  const { id } = req.params;
  const { index } = req.body; 

  try {
    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }
    if (
      !Array.isArray(challenge.pdfs) ||
      index < 0 ||
      index >= challenge.pdfs.length
    ) {
      return res.status(400).json({ message: "Invalid PDF index" });
    }
    challenge.pdfs.splice(index, 1);
    await challenge.save();
    res.status(200).json({ message: "PDF deleted successfully", challenge });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Edit challenge details (title, description, longDescription)
exports.editChallenge = async (req, res) => {
  const { id } = req.params;
  const { title, description, longDescription, startDate, endDate, pointsPerLog } = req.body;

  try {
    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    if (title !== undefined) challenge.title = title;
    if (description !== undefined) challenge.description = description;
    if (longDescription !== undefined) challenge.longDescription = longDescription;
    if (pointsPerLog !== undefined) {
      const pointsPerLogValue = Number(pointsPerLog)
      if (isNaN(pointsPerLogValue)) {
        return res.status(400).json({ message: "pointsPerLog must be a number" })
      }
      if (pointsPerLogValue < 0) {
        return res.status(400).json({ message: "pointsPerLog cannot be negative" })
      }
      challenge.pointsPerLog = pointsPerLogValue
    }
    
    // Validate and update dates if provided
    if (startDate !== undefined || endDate !== undefined) {
      const start = startDate ? parseLocalDate(startDate) : parseLocalDate(challenge.startDate.toISOString());
      const end = endDate ? parseLocalDate(endDate) : parseLocalDate(challenge.endDate.toISOString());

      if (!start || !end) {
        return res.status(400).json({ message: "Invalid date format" });
      }

      // Validate that endDate is after startDate
      if (end <= start) {
        return res
          .status(400)
          .json({ message: "End date must be after start date" });
      }

      if (startDate !== undefined) challenge.startDate = start;
      if (endDate !== undefined) challenge.endDate = end;
    }

    await challenge.save();

    res.status(200).json({ message: "Challenge updated successfully", challenge });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Delete a challenge and remove it from users' joinedChallenges
// Submit a daily activity log for the current user on a challenge
exports.submitDailyLog = async (req, res) => {
  const { id } = req.params
  const { activityValue, notes } = req.body
  const userId = req.user.userId

  if (!activityValue && activityValue !== 0) {
    return res.status(400).json({ message: "Activity value is required" })
  }

  try {
    const challenge = await Challenge.findById(id)
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" })
    }

    if (
      !challenge.participants.some(
        (participant) => participant.toString() === userId
      )
    ) {
      return res
        .status(403)
        .json({ message: "You must join this challenge before logging activity" })
    }

    const today = getTodayLocal()

    const existingLog = await ActivityLog.findOne({
      student: userId,
      challenge: id,
      logDate: today,
    })

    if (existingLog) {
      return res
        .status(400)
        .json({ message: "Today's activity has already been logged." })
    }

    const pointsEarned = challenge.pointsPerLog ?? 0

    const activityLog = new ActivityLog({
      student: userId,
      challenge: id,
      activityValue,
      notes,
      pointsEarned,
      logDate: today,
    })

    await activityLog.save()
    await User.findByIdAndUpdate(userId, {
      $inc: { totalPoints: pointsEarned },
    })

    res.status(201).json({
      message: "Daily activity logged successfully.",
      pointsEarned,
      activityLog,
    })
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message })
  }
}

// Get the current user's logs for a challenge
exports.getUserChallengeLogs = async (req, res) => {
  const { id } = req.params
  const userId = req.user.userId

  try {
    const challenge = await Challenge.findById(id)
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" })
    }

    if (
      !challenge.participants.some(
        (participant) => participant.toString() === userId
      )
    ) {
      return res
        .status(403)
        .json({ message: "You must join this challenge to view logs" })
    }

    const logs = await ActivityLog.find({
      student: userId,
      challenge: id,
    })
      .sort({ logDate: -1 })
      .lean()

    res.status(200).json(logs)
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message })
  }
}

// Get challenge-specific leaderboard sorted by total points earned
exports.getChallengeLeaderboard = async (req, res) => {
  const { id } = req.params

  try {
    const challenge = await Challenge.findById(id).populate(
      "participants",
      "name email"
    )
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" })
    }

    const totals = await ActivityLog.aggregate([
      { $match: { challenge: challenge._id } },
      {
        $group: {
          _id: "$student",
          totalPoints: { $sum: "$pointsEarned" },
        },
      },
    ])

    const totalsMap = new Map(
      totals.map((entry) => [entry._id.toString(), entry.totalPoints])
    )

    const includeEmail = req.user && req.user.role === "coordinator"

    const leaderboard = (challenge.participants || [])
      .filter(Boolean)
      .map((participant) => {
        const student = {
          _id: participant._id,
          name: participant.name || "Unknown",
        }
        if (includeEmail) student.email = participant.email || ""
        return {
          student,
          totalPoints: totalsMap.get(participant._id.toString()) || 0,
        }
      })
      .sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) {
          return b.totalPoints - a.totalPoints
        }
        const nameA = (a.student.name || "").toLowerCase()
        const nameB = (b.student.name || "").toLowerCase()
        if (nameA < nameB) return -1
        if (nameA > nameB) return 1
        return 0
      })
      .map((entry, index) => ({
        student: entry.student,
        totalPoints: entry.totalPoints,
        rank: index + 1,
      }))

    res.status(200).json(leaderboard)
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message })
  }
}

// Participant leaves a challenge: remove from challenge, user, and delete their logs
exports.leaveChallenge = async (req, res) => {
  const { id } = req.params
  const userId = req.user.userId

  try {
    const challenge = await Challenge.findById(id)
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" })
    }

    if (!challenge.participants.some((p) => p.toString() === userId)) {
      return res.status(400).json({ message: "You are not enrolled in this challenge" })
    }

    const userLogs = await ActivityLog.find({ student: userId, challenge: id })
    const totalPointsToRemove = userLogs.reduce(
      (sum, log) => sum + (log.pointsEarned || 0),
      0
    )

    // Remove participant and update count
    challenge.participants = challenge.participants.filter(
      (p) => p.toString() !== userId
    )
    challenge.participantCount = challenge.participants.length
    await challenge.save()

    // Remove challenge from user's joinedChallenges
    await User.findByIdAndUpdate(userId, {
      $pull: { joinedChallenges: id },
      $inc: { totalPoints: -totalPointsToRemove },
    })

    // Delete all activity logs for this user in this challenge
    await ActivityLog.deleteMany({ student: userId, challenge: id })

    res.status(200).json({ message: "Left challenge successfully", challenge })
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message })
  }
}

exports.deleteChallenge = async (req, res) => {
  const { id } = req.params;
  try {
    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    // Adjust user totalPoints for all logs in this challenge
    const totalsByUser = await ActivityLog.aggregate([
      { $match: { challenge: challenge._id } },
      {
        $group: {
          _id: "$student",
          totalPoints: { $sum: "$pointsEarned" },
        },
      },
    ])

    await Promise.all(
      totalsByUser.map((entry) =>
        User.findByIdAndUpdate(entry._id, {
          $inc: { totalPoints: -entry.totalPoints },
          $pull: { joinedChallenges: id },
        })
      )
    )

    // Delete activity logs for the challenge
    await ActivityLog.deleteMany({ challenge: id })

    // Remove challenge from all users' joinedChallenges arrays
    await User.updateMany(
      { joinedChallenges: id },
      { $pull: { joinedChallenges: id } }
    );

    await Challenge.findByIdAndDelete(id);

    res.status(200).json({ message: "Challenge deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Coordinator invites a user to a challenge (creates a pending invitation and notifies user)
exports.inviteUser = async (req, res) => {
  if (req.user.role !== "coordinator")
    return res.status(403).json({ message: "Access denied" })

  const { id } = req.params // challenge id
  const { userId } = req.body

  try {
    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ message: "User not found" })

    const challenge = await Challenge.findById(id)
    if (!challenge) return res.status(404).json({ message: "Challenge not found" })

    // Don't invite already participant
    if (challenge.participants.some((p) => p.toString() === userId)) {
      return res.status(400).json({ message: "User already enrolled" })
    }

    // Prevent duplicate pending invite
    const existing = challenge.invitations.find(
      (inv) => inv.user.toString() === userId && inv.status === "pending"
    )
    if (existing) {
      return res.status(400).json({ message: "Invite already pending" })
    }

    // Add invitation
    challenge.invitations.push({ user: userId, status: "pending", invitedBy: req.user.userId })
    await challenge.save()

    // Add in-app notification to the user
    await User.findByIdAndUpdate(userId, {
      $push: {
        notifications: {
          type: "invite",
          payload: { challengeId: id, inviterId: req.user.userId },
        },
      },
    })

    res.status(200).json({ message: "Invitation sent" })
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message })
  }
}

// Coordinator: list invitations for a challenge
exports.getChallengeInvitations = async (req, res) => {
  if (req.user.role !== "coordinator")
    return res.status(403).json({ message: "Access denied" })

  const { id } = req.params
  try {
    const challenge = await Challenge.findById(id).populate(
      "invitations.user",
      "name email"
    )
    if (!challenge) return res.status(404).json({ message: "Challenge not found" })

    res.status(200).json(challenge.invitations || [])
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message })
  }
}

// Participant: get their invitations (across challenges)
exports.getUserInvitations = async (req, res) => {
  const userId = req.user.userId
  try {
    const challenges = await Challenge.find({ 'invitations.user': userId }).select(
      'title description startDate endDate invitations'
    )

    const invitations = []
    challenges.forEach((ch) => {
      const inv = (ch.invitations || []).find((i) => i.user.toString() === userId)
      if (inv) {
        invitations.push({
          challengeId: ch._id,
          title: ch.title,
          description: ch.description,
          startDate: ch.startDate,
          endDate: ch.endDate,
          status: inv.status,
          invitedAt: inv.invitedAt,
          respondedAt: inv.respondedAt,
        })
      }
    })

    res.status(200).json(invitations)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// Participant accepts an invitation
exports.acceptInvitation = async (req, res) => {
  const { id } = req.params // challenge id
  const userId = req.user.userId

  try {
    const challenge = await Challenge.findById(id)
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' })

    const invIndex = (challenge.invitations || []).findIndex(
      (i) => i.user.toString() === userId && i.status === 'pending'
    )
    if (invIndex === -1) return res.status(400).json({ message: 'No pending invitation found' })

    // mark invitation accepted
    challenge.invitations[invIndex].status = 'accepted'
    challenge.invitations[invIndex].respondedAt = new Date()

    // add to participants if not already
    if (!challenge.participants.some((p) => p.toString() === userId)) {
      challenge.participants.push(userId)
    }
    challenge.participantCount = challenge.participants.length
    await challenge.save()

    // update user joinedChallenges
    await User.findByIdAndUpdate(userId, { $addToSet: { joinedChallenges: id } })

    // notify inviter (simple push to notifications for all coordinators who invited)
    const inviterId = challenge.invitations[invIndex].invitedBy
    if (inviterId) {
      await User.findByIdAndUpdate(inviterId, {
        $push: {
          notifications: {
            type: 'invite_response',
            payload: { challengeId: id, userId, response: 'accepted' },
          },
        },
      })
    }

    res.status(200).json({ message: 'Invitation accepted' })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// Participant rejects an invitation
exports.rejectInvitation = async (req, res) => {
  const { id } = req.params // challenge id
  const userId = req.user.userId

  try {
    const challenge = await Challenge.findById(id)
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' })

    const invIndex = (challenge.invitations || []).findIndex(
      (i) => i.user.toString() === userId && i.status === 'pending'
    )
    if (invIndex === -1) return res.status(400).json({ message: 'No pending invitation found' })

    // mark invitation rejected
    challenge.invitations[invIndex].status = 'rejected'
    challenge.invitations[invIndex].respondedAt = new Date()
    await challenge.save()

    // notify inviter
    const inviterId = challenge.invitations[invIndex].invitedBy
    if (inviterId) {
      await User.findByIdAndUpdate(inviterId, {
        $push: {
          notifications: {
            type: 'invite_response',
            payload: { challengeId: id, userId, response: 'rejected' },
          },
        },
      })
    }

    res.status(200).json({ message: 'Invitation rejected' })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// Coordinator cancels a pending invitation
// cancelInvitation removed