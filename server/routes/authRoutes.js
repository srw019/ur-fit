/**
 * authRoutes.js
 * -------------
 * Auth routes for signup and login.
 */

const express = require('express');
const router = express.Router();
const { signup, login } = require('../controllers/authController');

// Route for user signup
router.post('/signup', signup);

// Route for user login
router.post('/login', login);

module.exports = router;