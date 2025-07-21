// backend/models/Solution.js
const mongoose = require('mongoose');

const SolutionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  problem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    enum: ['python', 'c', 'cpp', 'java'], // Supported languages
    required: true,
  },
  verdict: {
    type: String,
    enum: ['Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Memory Limit Exceeded', 'Runtime Error', 'Compilation Error', 'Pending', 'Error'],
    default: 'Pending',
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  executionTime: { // Optional: how long it took to run (in ms)
    type: Number,
  },
  output: { // Optional: captured output from the first test case or error message
    type: String,
  },
  // Add more fields if needed, e.g., memoryUsage
});

// Add index for faster querying user's solutions for a problem
SolutionSchema.index({ user: 1, problem: 1, submittedAt: -1 });

module.exports = mongoose.model('Solution', SolutionSchema);