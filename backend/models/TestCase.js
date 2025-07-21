const mongoose = require('mongoose');

const TestCaseSchema = new mongoose.Schema({
  problem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem', // Refers to the Problem model
    required: true,
  },
  input: {
    type: String,
    required: true,
  },
  output: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add an index to efficiently query test cases by problem
TestCaseSchema.index({ problem: 1 });

module.exports = mongoose.model('TestCase', TestCaseSchema);