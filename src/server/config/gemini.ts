import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GOOGLE_API_KEY) {
  throw new Error('Missing GOOGLE_API_KEY environment variable');
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export const gemini = {
  genAI,
  recipeModel: genAI.getGenerativeModel({
    model: 'gemini-2.0-flash', 
    generationConfig: {
      temperature: 0.7,         
      topP: 0.8,                
      topK: 40,                 
      maxOutputTokens: 2048,     
      responseMimeType: 'application/json' 
    }
  })
};
