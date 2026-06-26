/**
 * server.js
 * ---------
 * Main backend server file for UR Fit.
 * Starts Express, hooks up routes and static files.
 */

const express = require("express")
const cors = require("cors")
const dotenv = require("dotenv")
const connectDB = require("./config/db")
const path = require("path")

// Load environment variables from .env file
dotenv.config()
// Connect to MongoDB
connectDB()

const app = express()
// Enable CORS for all routes
app.use(cors())
// Parse incoming JSON requests
app.use(express.json())
// Serve static files from the /public directory
app.use("/public", express.static(path.join(__dirname, "public")))

// Register authentication routes
app.use("/api/auth", require("./routes/authRoutes"))

// Register challenge-related routes
const challengeRoutes = require("./routes/challengeRoutes")
app.use("/api/challenges", challengeRoutes)

// Register image upload routes
const uploadRoutes = require("./routes/uploadImageRoutes")
app.use("/api/upload", uploadRoutes)

// Register user-related routes
const userRoutes = require("./routes/userRoutes")
app.use("/api/users", userRoutes)

// Start the server on the specified port
const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
