/**
 * db.js
 * -----
 * Handles connecting to MongoDB from the backend.
 */

const mongoose = require('mongoose');

// Function to connect to MongoDB using the URI from environment variables
const connectDB = async () => {
  try {
    // Attempt to connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (error) {
    // Log error and exit if connection fails
    console.error('MongoDB error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;