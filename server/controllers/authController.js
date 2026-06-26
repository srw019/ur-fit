/**
 * authController.js
 * -----------------
 * Auth logic for signup, login, and user lookup.
 */
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const User = require("../models/User")

// Register a new user
exports.signup = async (req, res) => {
  const { name, email, password, role } = req.body

  try {
    // Normalize email to lowercase for case-insensitive comparison
    const normalizedEmail = email.toLowerCase()
    
    // Check if user already exists (case-insensitive)
    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" })

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)
    // Create and save the new user with lowercase email
    const user = new User({ name, email: normalizedEmail, password: hashedPassword, role })

    await user.save()
    res.status(201).json({ message: "Signup successful" })
  } catch (err) {
    res.status(500).json({ message: "Server error" })
  }
}

// Authenticate user and return JWT token
exports.login = async (req, res) => {
  const { email, password } = req.body

  try {
    // Normalize email to lowercase for case-insensitive lookup
    const normalizedEmail = email.toLowerCase()
    
    // Find user by email (case-insensitive)
    const user = await User.findOne({ email: normalizedEmail })
    if (!user) return res.status(400).json({ message: "Invalid credentials" })

    // Compare password (case-sensitive)
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" })

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    )

    // Respond with token and user info
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (err) {
    res.status(500).json({ message: "Server error" })
  }
}

// Get all users with role "participant" (excluding passwords)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "participant" }, "-password")
    res.json(users)
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message })
  }
}