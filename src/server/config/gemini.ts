import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GOOGLE_API_KEY) {
  throw new Error('Missing GOOGLE_API_KEY environment variable');
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

/**
 * Default configuration for generating recipes using the Gemini model.
 * @property {number} temperature - The temperature of the model, controlling the randomness of the output.
 * @property {number} topP - The top P most likely tokens to be generated.
 * @property {number} topK - The top K most likely tokens to be generated.
 * @property {number} maxOutputTokens - The maximum number of tokens to be generated.
 */
export const DEFAULT_RECIPE_GENERATION_CONFIG = {
  temperature: 0.7,
  topP: 0.9,
  topK: 40,
  maxOutputTokens: 2048,
};

export const gemini = {
  recipeModel: genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: DEFAULT_RECIPE_GENERATION_CONFIG,
  })
};
