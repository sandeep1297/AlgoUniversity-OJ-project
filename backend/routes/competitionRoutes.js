const express = require('express');
const Competition = require('../models/Competition');
const Problem = require('../models/Problems'); // Needed to validate problem IDs
const jwt = require('jsonwebtoken'); // For protection middleware
const User = require('../models/User'); // For protection middleware

const router = express.Router();

// Middleware to protect routes (checks if user is logged in and active)
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user || !req.user.isActive) {
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

// Helper function to validate problem IDs
const validateProblemIds = async (problemIds) => {
    if (!Array.isArray(problemIds)) {
        return { isValid: false, message: 'Problems must be an array of IDs.' };
    }
    const problems = await Problem.find({ '_id': { $in: problemIds } });
    if (problems.length !== problemIds.length) {
        const foundIds = new Set(problems.map(p => p._id.toString()));
        const missingIds = problemIds.filter(id => !foundIds.has(id));
        return { isValid: false, message: `One or more problems not found: ${missingIds.join(', ')}` };
    }
    return { isValid: true };
};

// @route   POST /api/competitions
// @desc    Create a new competition (Admin only)
// @access  Private/Admin
router.post('/', protect, adminProtect, async (req, res) => {
  const { name, description, startTime, endTime, problems } = req.body;

  if (!name || !description || !startTime || !endTime) {
    return res.status(400).json({ message: 'Please provide name, description, start time, and end time.' });
  }

  // Basic date validation
  if (new Date(startTime) >= new Date(endTime)) {
    return res.status(400).json({ message: 'Start time must be before end time.' });
  }

  try {
    const competitionExists = await Competition.findOne({ name });
    if (competitionExists) {
      return res.status(400).json({ message: 'A competition with this name already exists.' });
    }

    // Validate problem IDs if provided
    if (problems && problems.length > 0) {
      const validation = await validateProblemIds(problems);
      if (!validation.isValid) {
        return res.status(400).json({ message: validation.message });
      }
    }

    const competition = new Competition({
      name,
      description,
      startTime,
      endTime,
      problems: problems || [],
      organizer: req.user._id, // Set the current admin user as organizer
    });

    const createdCompetition = await competition.save();
    res.status(201).json({
      message: 'Competition created successfully!',
      competition: createdCompetition,
    });
  } catch (error) {
    console.error('Error creating competition:', error);
    res.status(500).json({ message: 'Server error while creating competition.', error: error.message });
  }
});

// @route   GET /api/competitions
// @desc    Get all competitions (Public)
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Optionally filter for active/upcoming competitions for general users, or return all for admin view
    const competitions = await Competition.find({})
      .populate('problems', 'name difficulty') // Populate problems with just name and difficulty
      .populate('organizer', 'userId fullName') // Populate organizer with userId and fullName
      .sort({ startTime: 1 }); // Sort by start time

    res.status(200).json(competitions);
  } catch (error) {
    console.error('Error fetching competitions:', error);
    res.status(500).json({ message: 'Server error while fetching competitions.', error: error.message });
  }
});

// @route   GET /api/competitions/:id
// @desc    Get a single competition by ID (Public)
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id)
      .populate('problems', 'name difficulty') // Populate problems
      .populate('organizer', 'userId fullName'); // Populate organizer

    if (!competition) {
      return res.status(404).json({ message: 'Competition not found.' });
    }
    res.status(200).json(competition);
  } catch (error) {
    console.error('Error fetching single competition:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid competition ID.' });
    }
    res.status(500).json({ message: 'Server error while fetching competition.', error: error.message });
  }
});

// @route   PUT /api/competitions/:id
// @desc    Update a specific competition by ID (Admin only)
// @access  Private/Admin
router.put('/:id', protect, adminProtect, async (req, res) => {
  const { name, description, startTime, endTime, problems } = req.body;

  try {
    const competition = await Competition.findById(req.params.id);

    if (!competition) {
      return res.status(404).json({ message: 'Competition not found.' });
    }

    // Prevent name change if new name already exists for another competition
    if (name && name !== competition.name) {
      const existingCompetition = await Competition.findOne({ name });
      if (existingCompetition) {
        return res.status(400).json({ message: 'Another competition with this name already exists.' });
      }
    }

    // Validate problem IDs if provided
    if (problems !== undefined) { // Allow empty array to clear problems
        const validation = await validateProblemIds(problems);
        if (!validation.isValid) {
            return res.status(400).json({ message: validation.message });
        }
        competition.problems = problems;
    }

    // Update fields if provided
    competition.name = name || competition.name;
    competition.description = description || competition.description;
    competition.startTime = startTime || competition.startTime;
    competition.endTime = endTime || competition.endTime;

    // Re-check date validity after potential updates
    if (new Date(competition.startTime) >= new Date(competition.endTime)) {
      return res.status(400).json({ message: 'Updated start time must be before updated end time.' });
    }

    const updatedCompetition = await competition.save();
    res.status(200).json({
      message: 'Competition updated successfully!',
      competition: updatedCompetition,
    });
  } catch (error) {
    console.error('Error updating competition:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid competition ID.' });
    }
    res.status(500).json({ message: 'Server error while updating competition.', error: error.message });
  }
});

// @route   DELETE /api/competitions/:id
// @desc    Delete a specific competition by ID (Admin only)
// @access  Private/Admin
router.delete('/:id', protect, adminProtect, async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id);

    if (!competition) {
      return res.status(404).json({ message: 'Competition not found.' });
    }

    await Competition.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: 'Competition deleted successfully!' });
  } catch (error) {
    console.error('Error deleting competition:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid competition ID.' });
    }
    res.status(500).json({ message: 'Server error while deleting competition.', error: error.message });
  }
});

module.exports = router;