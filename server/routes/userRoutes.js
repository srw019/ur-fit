/**
 * userRoutes.js
 * -------------
 * Routes for user lookup and coordinator user management.
 */

const express = require("express")
const router = express.Router()
const auth = require("../middleware/auth")
const { getAllUsers } = require("../controllers/authController")

const { getUserInvitations } = require("../controllers/challengeController")

// GET / : Return all users (for coordinators)
router.get("/", getAllUsers)

// GET /me/invitations : Return current user's invitations
router.get("/me/invitations", auth, getUserInvitations)

module.exports = router
