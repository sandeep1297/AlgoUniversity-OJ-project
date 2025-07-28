// backend/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import all your routes
const problemRoutes = require('./routes/problemRoutes');
const testCaseRoutes = require('./routes/testCaseRoutes');
const competitionRoutes = require('./routes/competitionRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const userRoutes = require('./routes/userRoutes');
const geminiRoutes = require('./routes/geminiRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Basic route
app.get('/', (req, res) => {
  res.send('Online Judge Backend is running!');
});

// Use all your API routes
app.use('/api/users', userRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/testcases', testCaseRoutes);
app.use('/api/competitions', competitionRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/gemini', geminiRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});