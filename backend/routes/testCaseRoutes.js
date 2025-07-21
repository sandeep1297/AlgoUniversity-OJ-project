const express = require('express');
const TestCase = require('../models/TestCase');
const Problem = require('../models/Problems'); // Needed to check if problem exists
const jwt = require('jsonwebtoken'); // Re-using JWT for protection
const User = require('../models/User'); // Re-using User for protection

const router = express.Router();

// Middleware to protect routes (checks if user is logged in and active)
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user || !req.user.isActive) { // Check both existence and active status
        return res.status(401).json({ message: 'Not authorized, user not found or account deactivated' });
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

// @route   POST /api/testcases
// @desc    Add a new test case for a specific problem (Admin only)
// @access  Private/Admin
router.post('/', protect, adminProtect, async (req, res) => {
  const { problemId, input, output } = req.body;

  if (!problemId || !input || !output) {
    return res.status(400).json({ message: 'Please provide problemId, input, and output for the test case.' });
  }

  try {
    const problemExists = await Problem.findById(problemId);
    if (!problemExists) {
      return res.status(404).json({ message: 'Problem not found.' });
    }

    const testCase = new TestCase({
      problem: problemId,
      input,
      output,
    });

    const createdTestCase = await testCase.save();
    res.status(201).json({
      message: 'Test case added successfully!',
      testCase: createdTestCase,
    });
  } catch (error) {
    console.error('Error adding test case:', error);
    res.status(500).json({ message: 'Server error while adding test case.', error: error.message });
  }
});

// @route   GET /api/testcases/:problemId
// @desc    Get all test cases for a specific problem (Admin only)
// @access  Private/Admin
router.get('/:problemId', protect, adminProtect, async (req, res) => {
  try {
    const problemExists = await Problem.findById(req.params.problemId);
    if (!problemExists) {
      return res.status(404).json({ message: 'Problem not found.' });
    }

    const testCases = await TestCase.find({ problem: req.params.problemId }).sort({ createdAt: 1 });
    res.status(200).json(testCases);
  } catch (error) {
    console.error('Error fetching test cases:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid problem ID.' });
    }
    res.status(500).json({ message: 'Server error while fetching test cases.', error: error.message });
  }
});

// @route   PUT /api/testcases/:id
// @desc    Update a specific test case by ID (Admin only)
// @access  Private/Admin
router.put('/:id', protect, adminProtect, async (req, res) => {
  const { input, output } = req.body; // problemId cannot be changed

  try {
    const testCase = await TestCase.findById(req.params.id);

    if (!testCase) {
      return res.status(404).json({ message: 'Test case not found.' });
    }

    testCase.input = input !== undefined ? input : testCase.input;
    testCase.output = output !== undefined ? output : testCase.output;

    const updatedTestCase = await testCase.save();
    res.status(200).json({
      message: 'Test case updated successfully!',
      testCase: updatedTestCase,
    });
  } catch (error) {
    console.error('Error updating test case:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid test case ID.' });
    }
    res.status(500).json({ message: 'Server error while updating test case.', error: error.message });
  }
});

// @route   DELETE /api/testcases/:id
// @desc    Delete a specific test case by ID (Admin only)
// @access  Private/Admin
router.delete('/:id', protect, adminProtect, async (req, res) => {
  try {
    const testCase = await TestCase.findById(req.params.id);

    if (!testCase) {
      return res.status(404).json({ message: 'Test case not found.' });
    }

    await TestCase.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: 'Test case deleted successfully!' });
  } catch (error) {
    console.error('Error deleting test case:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid test case ID.' });
    }
    res.status(500).json({ message: 'Server error while deleting test case.', error: error.message });
  }
});

module.exports = router;