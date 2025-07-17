const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const router = express.Router();


// Middleware to protect routes 
const protect = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded.id; // Attach user ID to request
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};


// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1h', // Token expires in 1 hour
  });
};


// @route   POST /api/users/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  const { userId, password, email, dob, fullName } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      userId,
      password,
      email,
      dob,
      fullName,
    });

    if (user) {
      res.status(201).json({
        message: 'User registered successfully',
        _id: user._id,
        userId: user.userId,
        email: user.email,
        fullName: user.fullName,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// @route   POST /api/users/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        message: 'Logged in successfully',
        _id: user._id,
        userId: user.userId,
        email: user.email,
        fullName: user.fullName,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user).select('-password'); // Exclude password
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user);

    if (user) {
      user.userId = req.body.userId || user.userId;
      user.email = req.body.email || user.email;
      user.dob = req.body.dob || user.dob;
      user.fullName = req.body.fullName || user.fullName;

      if (req.body.password) {
        user.password = req.body.password; // Pre-save hook will hash it
      }

      const updatedUser = await user.save();

      res.json({
        message: 'Profile updated successfully',
        _id: updatedUser._id,
        userId: updatedUser.userId,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        token: generateToken(updatedUser._id), // Generate new token if user data changes (optional)
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// @route   DELETE /api/users/:id
// @desc    Delete a user (self-deletion)
// @access  Private (for now, protecting with `protect` middleware)
router.delete('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      if (user._id.toString() !== req.user) {
        return res.status(403).json({ message: 'Not authorized to delete this user' });
      }
      await User.deleteOne({ _id: req.params.id });
      res.json({ message: 'User removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;