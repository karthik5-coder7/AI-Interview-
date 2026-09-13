const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

/* =================================
   ENVIRONMENT CONFIGURATION
================================= */

dotenv.config({
  path: path.resolve(__dirname, '../.env'),
});

console.log('NVIDIA key loaded:', !!process.env.NVIDIA_API_KEY);

const app = express();

/* =================================
   MIDDLEWARE
================================= */

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use(express.json({ limit: '1mb' }));

/* =================================
   NVIDIA CONFIGURATION
================================= */

const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

const MODEL = 'openai/gpt-oss-20b';

/* =================================
   NVIDIA AI FUNCTION
================================= */

async function askNvidia(prompt) {
  if (!process.env.NVIDIA_API_KEY) {
    throw new Error('NVIDIA API key is not configured.');
  }

  const response = await fetch(NVIDIA_URL, {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
    },

    body: JSON.stringify({
      model: MODEL,

      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],

      temperature: 0.2,
      max_tokens: 1200,
    }),
  });

  const data = await response.json();

  console.log('NVIDIA API status:', response.status);

  if (!response.ok) {
    console.error('NVIDIA API error:', JSON.stringify(data, null, 2));

    throw new Error(
      data?.error?.message ||
        data?.message ||
        data?.detail ||
        'NVIDIA API request failed',
    );
  }

  const answer = data?.choices?.[0]?.message?.content;

  if (!answer) {
    throw new Error('NVIDIA returned no answer.');
  }

  return answer;
}

/* =================================
   HEALTH CHECK
================================= */

app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'AI Interview backend is running!',
    model: MODEL,
  });
});

/* =================================
   GENERATE QUESTION
================================= */

app.post('/generate-question', async (req, res) => {
  try {
    const { category, difficulty, customTopic } = req.body;

    const prompt = `
You are an expert technical interviewer.

Generate ONE interview question.

Category: ${category || 'General'}
Difficulty: ${difficulty || 'Medium'}
Custom Topic: ${customTopic || 'None'}

Rules:
- Ask exactly one interview question.
- Make it appropriate for the selected difficulty.
- If a custom topic is provided, focus on that topic.
- If no custom topic is provided, use the selected category.
- Make the question useful for a real technical interview.
- Do not use Markdown.
- Do not use ## or ###.
- Do not use **.
- Do not use code fences.

Return only the question.
`;

    const question = await askNvidia(prompt);

    res.json({
      question: question.trim(),
    });
  } catch (error) {
    console.error('GENERATE QUESTION ERROR:', error);

    res.status(500).json({
      error: error?.message || 'Failed to generate question',
    });
  }
});

/* =================================
   GENERATE CORRECT ANSWER
================================= */

app.post('/generate-correct-answer', async (req, res) => {
  try {
    const { category, difficulty, customTopic, question } = req.body;

    console.log('Correct answer requested for:', question);

    if (!question || !question.trim()) {
      return res.status(400).json({
        error: 'Question is required',
      });
    }

    const prompt = `
You are an expert technical interviewer.

Generate the correct and ideal answer for this interview question.

Category: ${category || 'General'}
Difficulty: ${difficulty || 'Medium'}
Custom Topic: ${customTopic || 'None'}

Question:
${question}

Requirements:
- Give a clear and accurate interview-quality answer.
- Explain the important concepts.
- Include examples when useful.
- Match the requested difficulty.
- Do not use Markdown headings.
- Do not use ## or ###.
- Do not use **.
- Do not use code fences.
- Return only the answer.
`;

    const answer = await askNvidia(prompt);

    res.json({
      answer: answer.trim(),
    });
  } catch (error) {
    console.error('GENERATE CORRECT ANSWER ERROR:', error);

    res.status(500).json({
      error: error?.message || 'Failed to generate correct answer',
    });
  }
});

/* =================================
   REVIEW ANSWER
================================= */

app.post('/review-answer', async (req, res) => {
  try {
    const {
      category,
      difficulty,
      customTopic,
      question,
      candidateAnswer,
      correctAnswer,
    } = req.body;

    if (!question || !candidateAnswer) {
      return res.status(400).json({
        error: 'Question and candidate answer are required',
      });
    }

    const prompt = `
You are an expert technical interviewer.

Evaluate the candidate's answer.

Category: ${category || 'General'}
Difficulty: ${difficulty || 'Medium'}
Custom Topic: ${customTopic || 'None'}

Question:
${question}

Candidate Answer:
${candidateAnswer}

Ideal Answer:
${correctAnswer || 'Not provided'}

Return ONLY valid JSON.

Use exactly this structure:

{
  "score": 0,
  "rating": "Needs Improvement",
  "strengths": [],
  "weaknesses": [],
  "topicsToImprove": [],
  "recommendedTopics": [],
  "feedback": ""
}

Rules:
- score must be a number from 0 to 10.
- rating should reflect the score.
- strengths must be an array of strings.
- weaknesses must be an array of strings.
- topicsToImprove must be an array of strings.
- recommendedTopics must be an array of strings.
- feedback must be a useful interview feedback message.
- Do not use Markdown.
- Do not use code fences.
- Return valid JSON only.
`;

    const rawAnswer = await askNvidia(prompt);

    const cleaned = rawAnswer
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const review = JSON.parse(cleaned);

    res.json({
      review,
    });
  } catch (error) {
    console.error('REVIEW ANSWER ERROR:', error);

    res.status(500).json({
      error: error?.message || 'Failed to review answer',
    });
  }
});

/* =================================
   START SERVER
================================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on port ${PORT}`);
});
