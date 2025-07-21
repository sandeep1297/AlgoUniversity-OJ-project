// backend/routes/submissionRoutes.js
const express = require('express');
const Solution = require('../models/Solution');
const Problem = require('../models/Problems');
const TestCase = require('../models/TestCase');
const { executeCode } = require('../utils/codeEvaluator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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


// @route   POST /api/submissions/run
// @desc    Run code with custom input (no database submission)
// @access  Private
router.post('/run', protect, async (req, res) => {
  const { language, code, customInput } = req.body;

  if (!language || !code) {
    return res.status(400).json({ message: 'Please provide language and code.' });
  }

  try {
    // Note: No problemId needed for run, as it's not saving to db or using problem's test cases
    // timeLimitSeconds is default, as it's not a submission
    const evaluationResult = await executeCode(code, language, customInput || '', 5); // 5 seconds fixed for run

    // Return the raw output and error for display
    res.status(200).json({
      verdict: evaluationResult.verdict,
      output: evaluationResult.output,
      error: evaluationResult.error,
      executionTime: evaluationResult.executionTime
    });

  } catch (error) {
    console.error('Error running code:', error);
    res.status(500).json({ message: 'Server error during code run.', error: error.message });
  }
});


// @route   POST /api/submissions (EXISTING ROUTE - no change needed, it uses the same executeCode function)
// @desc    Submit code for a problem
// @access  Private
router.post('/', protect, async (req, res) => {
  const { problemId, language, code } = req.body;
  const userId = req.user._id;

  if (!problemId || !language || !code) {
    return res.status(400).json({ message: 'Please provide problemId, language, and code.' });
  }

  try {
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found.' });
    }

    const testCases = await TestCase.find({ problem: problemId });
    if (testCases.length === 0) {
      return res.status(400).json({ message: 'No test cases found for this problem. Cannot evaluate.' });
    }

    const newSubmission = new Solution({
      user: userId,
      problem: problemId,
      code,
      language,
      verdict: 'Pending',
    });
    await newSubmission.save();

    executeCode(code, language, testCases, problem.timeLimit) // Pass testCases array
      .then(async (evaluationResult) => {
        newSubmission.verdict = evaluationResult.verdict;
        newSubmission.output = evaluationResult.output;
        newSubmission.executionTime = evaluationResult.executionTime;
        // Optionally save detailed test case results: newSubmission.results = evaluationResult.results;
        await newSubmission.save();
        console.log(`Submission ${newSubmission._id} verdict: ${evaluationResult.verdict}`);
      })
      .catch(async (evalError) => {
        newSubmission.verdict = 'Error';
        newSubmission.output = `Evaluation system error: ${evalError.message}`;
        await newSubmission.save();
        console.error(`Evaluation error for submission ${newSubmission._id}:`, evalError);
      });

    res.status(202).json({
      message: 'Code submitted successfully. Evaluation pending...',
      submissionId: newSubmission._id,
      verdict: 'Pending',
    });

  } catch (error) {
    console.error('Error submitting code:', error);
    res.status(500).json({ message: 'Server error during submission.', error: error.message });
  }
});


// @route   GET /api/submissions/user/:problemId (EXISTING ROUTE)
// @desc    Get user's past submissions for a specific problem
// @access  Private
router.get('/user/:problemId', protect, async (req, res) => {
  try {
    const submissions = await Solution.find({
      user: req.user._id,
      problem: req.params.problemId
    }).sort({ submittedAt: -1 }).limit(10);
    res.status(200).json(submissions);
  } catch (error) {
    console.error('Error fetching user submissions:', error);
    res.status(500).json({ message: 'Server error fetching user submissions.', error: error.message });
  }
});

// @route   GET /api/submissions/:submissionId (EXISTING ROUTE)
// @desc    Get details of a single submission
// @access  Private (user can see their own, admin can see all)
router.get('/:submissionId', protect, async (req, res) => {
  try {
    const submission = await Solution.findById(req.params.submissionId)
                                     .populate('problem', 'name')
                                     .populate('user', 'userId fullName');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found.' });
    }

    // Allow user to view their own submission or admin to view any
    if (submission.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this submission.' });
    }

    res.status(200).json(submission);
  } catch (error) {
    console.error('Error fetching submission details:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid submission ID.' });
    }
    res.status(500).json({ message: 'Server error fetching submission details.', error: error.message });
  }
});


module.exports = router;