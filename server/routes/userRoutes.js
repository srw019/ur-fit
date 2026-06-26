/**
 * userRoutes.js
 * -------------
 * Routes for user lookup and coordinator user management.
 */

const express = require("express")
const router = express.Router()
const { getAllUsers } = require("../controllers/authController")

// GET / : Return all users (for coordinators)
router.get("/", getAllUsers)

module.exports = router
