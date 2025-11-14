/* eslint-disable @typescript-eslint/no-explicit-any */
import request from 'supertest';
import app from '../../index';
import { RecipeService } from '../../services/recipe/recipeService';
import { RecipeParamsSchema } from '../../schemas/recipe.schemas';

jest.mock('../../services/recipe/recipeService');

const mockedRecipeService = RecipeService as jest.Mocked<typeof RecipeService>;

describe('Recipe Controller (Integration Tests)', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/recipes/generate', () => {

    const validBody = {
      preferences: {
        diet: 'vegan',
        excludedIngredients: [],
        ingredientThemes: ['Tofu'],
      },
      nutritionalGoals: {
        minCalories: 300,
      },
    };

    const invalidBody = {
      preferences: {
        diet: 'no-diet',
      },
      nutritionalGoals: {
        minCalories: '-1029' 
      }
    };

    it('should return 400 Bad Request if Zod validation fails', async () => {
      const res = await request(app)
        .post('/api/recipes/generate')
        .send(invalidBody);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid request body');
      
      expect(mockedRecipeService.generateRecipe).not.toHaveBeenCalled();
    });

    it('should return 200 OK and recipe data if validation passes', async () => {
      const mockRecipe = { name: 'Tofu Scramble', preparationTime: 15 };
      mockedRecipeService.generateRecipe.mockResolvedValue(mockRecipe as any);

      const res = await request(app)
        .post('/api/recipes/generate')
        .send(validBody);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockRecipe);

      expect(mockedRecipeService.generateRecipe).toHaveBeenCalledTimes(1);
      expect(mockedRecipeService.generateRecipe).toHaveBeenCalledWith(
        RecipeParamsSchema.parse(validBody)
      );
    });

    it('should return 500 Internal Server Error if service throws', async () => {
      mockedRecipeService.generateRecipe.mockRejectedValue(new Error('Gemini API is down'));

      const res = await request(app)
        .post('/api/recipes/generate')
        .send(validBody);

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Failed to generate recipe');
      
      expect(mockedRecipeService.generateRecipe).toHaveBeenCalledTimes(1);
    });
  });
});