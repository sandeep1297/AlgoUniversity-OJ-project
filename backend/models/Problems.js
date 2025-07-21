// backend/models/Problem.js
const mongoose = require('mongoose');

const ProblemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  statement: { // The problem description or prompt
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Easy',
    required: true,
  },
  exampleInput: { // Example input for the problem
    type: String,
    default: '',
  },
  exampleOutput: { // Expected output for the example input
    type: String,
    default: '',
  },
  timeLimit: { // NEW: Time limit for execution in seconds (e.g., 1 for 1 second)
    type: Number,
    default: 1, // Default to 1 second
    min: 0.1, // Minimum time limit
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

ProblemSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Problem', ProblemSchema);