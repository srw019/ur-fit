/**
 * challengeController.js
 * ----------------------
 * Controller functions for managing wellness challenges in the UR Fit backend.
 */

const Challenge = require("../models/Challenge")
const User = require("../models/User")

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

    const challenge = new Challenge({
      title,
      description,
      longDescription,
      startDate: start,
      endDate: end,
      imageUrl,
      externalLink,
      pdfs,
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
  const { title, description, longDescription, startDate, endDate } = req.body;

  try {
    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    if (title !== undefined) challenge.title = title;
    if (description !== undefined) challenge.description = description;
    if (longDescription !== undefined) challenge.longDescription = longDescription;
    
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
exports.deleteChallenge = async (req, res) => {
  const { id } = req.params;
  try {
    const challenge = await Challenge.findByIdAndDelete(id);
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }
    // Remove challenge from all users' joinedChallenges arrays
    await User.updateMany(
      { joinedChallenges: id },
      { $pull: { joinedChallenges: id } }
    );
    res.status(200).json({ message: "Challenge deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};