import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('Missing GEMINI_API_KEY environment variable');
}

export const geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const geminiModel = geminiClient.getGenerativeModel({
  model: 'gemini-pro',
});
