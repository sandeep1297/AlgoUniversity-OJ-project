const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Problem = require('../models/Problems'); // Adjust the path to your Problem model

// Load environment variables
require('dotenv').config();

// Initialize the Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST request to get AI code review and suggestions
router.post('/review', async (req, res) => {
  try {
    const { problemId, language, code, problemStatement, exampleInput, exampleOutput } = req.body;

    if (!problemId || !language || !code) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // You can fetch the problem from the database for more robust context
    // const problem = await Problem.findById(problemId);
    // if (!problem) {
    //   return res.status(404).json({ message: "Problem not found." });
    // }

    // Construct a comprehensive prompt for the Gemini model
    const prompt = `
      You are an AI-powered coding assistant for an online judge system. Your task is to review a user's code for a given problem and provide helpful suggestions for improvement.

      The user is working on the following problem:
      Problem Statement:
      ${problemStatement}

      Example Input:
      ${exampleInput}

      Example Output:
      ${exampleOutput}

      Here is the user's code written in ${language}:
      \`\`\`${language}
      ${code}
      \`\`\`

      Please provide a detailed code review, including:
      1.  **Correctness:** Point out any potential bugs or logical errors.
      2.  **Efficiency:** Suggest ways to optimize the code for better time and space complexity.
      3.  **Clarity & Readability:** Recommend improvements to make the code easier to understand (e.g., better variable names, comments, code structure).

      Present your response in a clear and easy-to-read format, using Markdown.
    `;

    // Access the Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Generate content from the model
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const suggestions = response.text();

    res.status(200).json({ suggestions });

  } catch (error) {
    console.error('Error with Gemini API:', error);
    res.status(500).json({ message: 'Failed to get AI suggestions due to an internal server error.' });
  }
});

module.exports = router;