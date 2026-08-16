/**
 * challengeRoutes.js
 * ------------------
 * Routes for challenge-related API calls.
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
  inviteUser,
  getChallengeInvitations,
  acceptInvitation,
  rejectInvitation,
  getUserInvitations,
  addChallengeLink,
  updateSingleChallengeLink,
  updateSingleChallengePdf,
  addChallengePdf,
  deleteSingleChallengeLink,
  deleteSingleChallengePdf,
  editChallenge,
  deleteChallenge,
  submitDailyLog,
  getUserChallengeLogs,
  leaveChallenge,
  getChallengeLeaderboard,
} = require("../controllers/challengeController")

// Invite user to a challenge (coordinator)
router.post("/:id/invite", auth, inviteUser)

// Get invitations for a challenge (coordinator)
router.get("/:id/invitations", auth, getChallengeInvitations)

// Participant accepts/rejects invitations
router.post("/:id/invitations/accept", auth, acceptInvitation)
router.post("/:id/invitations/reject", auth, rejectInvitation)
// cancel invitation route removed

// Create a new challenge (requires auth - coordinator only)
router.post("/", auth, createChallenge)

// Get all challenges
router.get("/", getChallenges)

// Get challenges joined by the current user (requires auth) - MUST come before /:id
router.get("/joined/me", auth, getUserJoinedChallenges)

// Get a challenge by ID
router.get("/:id/leaderboard", auth, getChallengeLeaderboard)
router.get("/:id", getChallengeById)

// Join a challenge (participant, requires auth)
router.post("/:id/join", auth, joinChallenge)

// Leave a challenge (participant, requires auth)
router.post("/:id/leave", auth, leaveChallenge)

// Submit a daily activity log for a joined challenge
router.post("/:id/log", auth, submitDailyLog)

// Get current user's logs for a challenge
router.get("/:id/logs/me", auth, getUserChallengeLogs)

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
