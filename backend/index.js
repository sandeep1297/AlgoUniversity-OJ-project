require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const problemRoutes = require('./routes/problemRoutes');
const testCaseRoutes = require('./routes/testCaseRoutes');
const competitionRoutes = require('./routes/competitionRoutes');
const submissionRoutes = require('./routes/submissionRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Middleware
app.use(express.json()); // For parsing application/json
app.use(cors()); // Enable CORS for all routes

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Basic route
app.get('/', (req, res) => {
  res.send('Online Judge Backend is running!');
});

// Import and use user routes
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.use('/api/Problems', problemRoutes);

app.use('/api/testcases', testCaseRoutes);

app.use('/api/competitions', competitionRoutes);

app.use('/api/submissions', submissionRoutes);