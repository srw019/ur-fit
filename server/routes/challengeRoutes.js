/**
 * challengeRoutes.js
 * ------------------
 * Defines all challenge-related routes for the UR Fit backend.
 */

const express = require("express")
const auth = require("../middleware/auth")
const router = express.Router()
const {
  createChallenge,
  getChallenges,
  getChallengeById,
  joinChallenge,
  getUserJoinedChallenges,
  userEnrollment,
  addChallengeLink,
  updateSingleChallengeLink,
  updateSingleChallengePdf,
  addChallengePdf,
  deleteSingleChallengeLink,
  deleteSingleChallengePdf,
  editChallenge,
  deleteChallenge,
} = require("../controllers/challengeController")

// Create a new challenge (requires auth - coordinator only)
router.post("/", auth, createChallenge)

// Get all challenges
router.get("/", getChallenges)

// Get challenges joined by the current user (requires auth) - MUST come before /:id
router.get("/joined/me", auth, getUserJoinedChallenges)

// Get a challenge by ID
router.get("/:id", getChallengeById)

// Join a challenge (participant, requires auth)
router.post("/:id/join", auth, joinChallenge)

// Enroll a user in a challenge (coordinator, requires auth)
router.post("/enroll", auth, userEnrollment)

// Add a new external link to a challenge (requires auth)
router.post("/:id/link", auth, addChallengeLink)

// Update a single external link by index (requires auth)
router.put("/:id/links", auth, updateSingleChallengeLink)

// Update a single PDF resource by index (requires auth)
router.put("/:id/pdf", auth, updateSingleChallengePdf)

// Add a new PDF resource to a challenge (requires auth)
router.post("/:id/pdf", auth, addChallengePdf)

// Delete a single external link by index (requires auth)
router.delete("/:id/link", auth, deleteSingleChallengeLink)

// Delete a single PDF resource by index (requires auth)
router.delete("/:id/pdf", auth, deleteSingleChallengePdf)

// Edit challenge details (requires auth)
router.put("/:id/edit", auth, editChallenge)

// Delete a challenge (requires auth)
router.delete("/:id", auth, deleteChallenge)

module.exports = router
