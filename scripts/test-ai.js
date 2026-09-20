const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
require('dotenv').config();

async function testGemini() {
  console.log('Testing Gemini...');
  const key = process.env.AI_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent('Say hello in 5 words');
  console.log('Gemini Result:', result.response.text());
}

async function testGroq() {
  console.log('Testing Groq...');
  const key = process.env.AI_GROQ_API_KEY || process.env.GROQ_API_KEY;
  const groq = new Groq({ apiKey: key });
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: 'Say hello in 5 words' }],
  });
  console.log('Groq Result:', completion.choices[0]?.message?.content);
}

async function run() {
  try {
    await testGemini();
  } catch (err) {
    console.error('Gemini error:', err.message);
  }

  try {
    await testGroq();
  } catch (err) {
    console.error('Groq error:', err.message);
  }
}

run();
