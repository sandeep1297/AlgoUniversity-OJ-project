const express = require('express');
const Problem = require('../models/Problems');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); 

const router = express.Router();

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


// @route   POST /api/problems
// @desc    Add a new coding problem (Admin only)
// @access  Private/Admin
router.post('/', protect, adminProtect, async (req, res) => {
  const { name, statement, difficulty, exampleInput, exampleOutput } = req.body;

  if (!name || !statement || !difficulty) {
    return res.status(400).json({ message: 'Please enter all required fields: name, statement, difficulty.' });
  }

  try {
    const problemExists = await Problem.findOne({ name });
    if (problemExists) {
      return res.status(400).json({ message: 'A problem with this name already exists.' });
    }

    const problem = new Problem({
      name,
      statement,
      difficulty,
      exampleInput,
      exampleOutput,
    });

    const createdProblem = await problem.save();
    res.status(201).json({
      message: 'Problem created successfully!',
      problem: createdProblem
    });
  } catch (error) {
    console.error('Error adding problem:', error);
    res.status(500).json({ message: 'Server error while adding problem.', error: error.message });
  }
});

// @route   GET /api/problems
// @desc    Get all coding problems (Public)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const problems = await Problem.find({}).sort({ createdAt: -1 });
    res.status(200).json(problems);
  } catch (error) {
    console.error('Error fetching problems:', error);
    res.status(500).json({ message: 'Server error while fetching problems.', error: error.message });
  }
});

// @route   GET /api/problems/:id
// @desc    Get a single coding problem by ID (Public)
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found.' });
    }
    res.status(200).json(problem);
  } catch (error) {
    console.error('Error fetching single problem:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid problem ID.' });
    }
    res.status(500).json({ message: 'Server error while fetching problem.', error: error.message });
  }
});

// @route   PUT /api/problems/:id
// @desc    Update a coding problem by ID (Admin only)
// @access  Private/Admin
router.put('/:id', protect, adminProtect, async (req, res) => {
  const { name, statement, difficulty, exampleInput, exampleOutput } = req.body;

  try {
    const problem = await Problem.findById(req.params.id);

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found.' });
    }

    if (name && name !== problem.name) {
      const existingProblem = await Problem.findOne({ name });
      if (existingProblem) {
        return res.status(400).json({ message: 'Another problem with this name already exists.' });
      }
    }

    problem.name = name || problem.name;
    problem.statement = statement || problem.statement;
    problem.difficulty = difficulty || problem.difficulty;
    problem.exampleInput = exampleInput !== undefined ? exampleInput : problem.exampleInput;
    problem.exampleOutput = exampleOutput !== undefined ? exampleOutput : problem.exampleOutput;

    const updatedProblem = await problem.save();
    res.status(200).json({
      message: 'Problem updated successfully!',
      problem: updatedProblem
    });
  } catch (error) {
    console.error('Error updating problem:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid problem ID.' });
    }
    res.status(500).json({ message: 'Server error while updating problem.', error: error.message });
  }
});

// @route   DELETE /api/problems/:id
// @desc    Delete a coding problem by ID (Admin only)
// @access  Private/Admin
router.delete('/:id', protect, adminProtect, async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found.' });
    }

    await Problem.deleteOne({ _id: req.params.id });

    res.status(200).json({ message: 'Problem deleted successfully!' });
  } catch (error) {
    console.error('Error deleting problem:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid problem ID.' });
    }
    res.status(500).json({ message: 'Server error while deleting problem.', error: error.message });
  }
});

module.exports = router;