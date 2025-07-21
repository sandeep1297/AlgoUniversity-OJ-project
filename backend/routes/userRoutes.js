const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Generate JWT token - NOW INCLUDES ROLE and isActive
const generateToken = (id, role, isActive) => { // Include isActive in payload
  return jwt.sign({ id, role, isActive }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
};

// Middleware to protect routes (checks if user is logged in)
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user from DB to ensure they still exist and get their current role & status
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      // Check if user is active (crucial for protecting routes if account is deactivated)
      if (!req.user.isActive) {
        return res.status(403).json({ message: 'Account is deactivated.' });
      }
      next();
    } catch (error) {
      console.error('Token verification error:', error.message);
      res.status(401).json({ message: 'Not authorized, token failed or expired' });
    }
  }
  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Middleware to protect routes and ensure user is an admin
const adminProtect = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
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
      // role defaults to 'user', isActive defaults to 'true' from schema
    });

    if (user) {
      res.status(201).json({
        message: 'User registered successfully',
        _id: user._id,
        userId: user.userId,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive, // <-- INCLUDE isActive IN RESPONSE
        token: generateToken(user._id, user.role, user.isActive), // <-- INCLUDE isActive IN TOKEN
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
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
      // Check if account is active before logging in
      if (!user.isActive) {
        return res.status(403).json({ message: 'Your account has been deactivated. Please contact support.' });
      }

      res.json({
        message: 'Logged in successfully',
        _id: user._id,
        userId: user.userId,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive, // <-- INCLUDE isActive IN RESPONSE
        token: generateToken(user._id, user.role, user.isActive), // <-- INCLUDE isActive IN TOKEN
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  // req.user is populated by the protect middleware
  res.json({
    _id: req.user._id,
    userId: req.user.userId,
    email: req.user.email,
    fullName: req.user.fullName,
    dob: req.user.dob,
    role: req.user.role,
    isActive: req.user.isActive, // <-- RETURN isActive
  });
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const user = req.user;

    if (user) {
      user.userId = req.body.userId || user.userId;
      user.email = req.body.email || user.email;
      user.dob = req.body.dob || user.dob;
      user.fullName = req.body.fullName || user.fullName;

      if (req.body.password) {
        user.password = req.body.password;
      }
      // role and isActive are NOT allowed to be updated via this endpoint for security

      const updatedUser = await user.save();

      res.json({
        message: 'Profile updated successfully',
        _id: updatedUser._id,
        userId: updatedUser.userId,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
        isActive: updatedUser.isActive, // <-- RETURN UPDATED isActive
        token: generateToken(updatedUser._id, updatedUser.role, updatedUser.isActive), // <-- GENERATE NEW TOKEN WITH UPDATED isActive
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete a user (admin access or self-deletion)
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const userToDelete = await User.findById(req.params.id);

    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.user.role === 'admin') { // Admin can delete any user
      await User.deleteOne({ _id: req.params.id });
      res.json({ message: 'User removed by admin' });
    } else if (userToDelete._id.toString() === req.user._id.toString()) { // User can delete their own account
       await User.deleteOne({ _id: req.params.id });
       res.json({ message: 'Your account has been removed' });
    }
    else {
      res.status(403).json({ message: 'Not authorized to delete this user' });
    }
  } catch (error) {
    console.error('User deletion error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/users/admin/all
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/admin/all', protect, adminProtect, async (req, res) => {
  try {
    // Exclude password from the results
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Fetch all users (admin) error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/users/admin/update-role/:id
// @desc    Update a user's role (Admin only)
// @access  Private/Admin
router.put('/admin/update-role/:id', protect, adminProtect, async (req, res) => {
  const { role } = req.body;

  if (!role || !['user', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role provided. Must be "user" or "admin".' });
  }

  try {
    const userToUpdate = await User.findById(req.params.id);

    if (!userToUpdate) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Prevent an admin from changing their own role (optional, but good practice)
    if (userToUpdate._id.toString() === req.user._id.toString()) {
        return res.status(403).json({ message: 'Admins cannot change their own role.' });
    }

    userToUpdate.role = role;
    const updatedUser = await userToUpdate.save();

    res.json({
      message: `User role updated to ${updatedUser.role} successfully!`,
      user: {
        _id: updatedUser._id,
        userId: updatedUser.userId,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
      }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID.' });
    }
    res.status(500).json({ message: 'Server error while updating user role.', error: error.message });
  }
});

// @route   PUT /api/users/admin/toggle-active/:id
// @desc    Toggle a user's active status (Admin only)
// @access  Private/Admin
router.put('/admin/toggle-active/:id', protect, adminProtect, async (req, res) => {
  try {
    const userToUpdate = await User.findById(req.params.id);

    if (!userToUpdate) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Prevent an admin from deactivating/activating their own account
    if (userToUpdate._id.toString() === req.user._id.toString()) {
        return res.status(403).json({ message: 'Admins cannot change their own account status.' });
    }

    userToUpdate.isActive = !userToUpdate.isActive; // Toggle the status
    const updatedUser = await userToUpdate.save();

    res.json({
      message: `User account is now ${updatedUser.isActive ? 'active' : 'deactivated'}.`,
      user: {
        _id: updatedUser._id,
        userId: updatedUser.userId,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
      }
    });
  } catch (error) {
    console.error('Error toggling user active status:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID.' });
    }
    res.status(500).json({ message: 'Server error while toggling user status.', error: error.message });
  }
});


module.exports = router;