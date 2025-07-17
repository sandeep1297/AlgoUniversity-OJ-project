require('dotenv').config()

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

//  Middleware
app.use(express.json());  //  --> for parsing application/json
app.use(cors());  // --> Enable CORS for all routes

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then( () => console.log("MongoDB connected successfully"))
  .catch(err => console.error("MongoDB connection error:", err));

// Basic route
app.get('/', (req, res) => {
    res.send('Online Judje Backend is running!');
});


// Import and use user routes
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});