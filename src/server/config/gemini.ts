import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GOOGLE_API_KEY) {
  throw new Error('Missing GOOGLE_API_KEY environment variable');
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export const gemini = {
  recipeModel: genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
  }),
};
