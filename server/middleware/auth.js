/**
 * auth.js
 * -------
 * check the JWT token and attach user info to requests.
 */

const jwt = require("jsonwebtoken")

module.exports = (req, res, next) => {
  // Get the Authorization header
  const authHeader = req.headers.authorization
  // Check if header exists and starts with "Bearer "
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token, authorization denied" })
  }

  // Extract the token from the header
  const token = authHeader.split(" ")[1]
  try {
    // Verify the token and attach user info to req.user
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    // If token is invalid, return 401
    res.status(401).json({ message: "Token is not valid" })
  }
}
