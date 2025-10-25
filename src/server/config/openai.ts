import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import { RecipeSuggestion, RecipeGenerationConfig } from '../types/recipe.types';

dotenv.config({ path: '../../../.env' });

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY no está configurada en las variables de entorno');
}

export const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const testOpenAIConnection = async (): Promise<boolean> => {
  try {
    await client.models.list();
    console.log('✅ Conexión con OpenAI establecida correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con OpenAI:', error);
    return false;
  }
};

export type { RecipeSuggestion, RecipeGenerationConfig };

export { DEFAULT_RECIPE_CONFIG } from '../types/recipe.types';
