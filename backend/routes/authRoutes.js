const express = require('express');
const router = express.Router();
const { registerUser, loginUser, googleAuth } = require('./authController'); // Make sure googleAuth is exported from your controller

// Standard user authentication routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Google authentication route
router.post('/google', googleAuth); // This is the new route for Google login

module.exports = router;