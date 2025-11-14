import { Request, Response } from 'express';
import { RecipeService } from '../services/recipe/recipeService';
import { RecipeParamsSchema } from '../schemas/recipe.schemas';
import { z } from 'zod';

/**
 * Generates a recipe based on the provided parameters
 */
export const generateRecipe = async (req: Request, res: Response) => {
  try {
    const params = RecipeParamsSchema.parse(req.body);

    const recipe = await RecipeService.generateRecipe(params);

    res.status(200).json({
      success: true,
      data: recipe,
    });
  } catch (error) {
    console.error('Error generating recipe:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request body',
        errors: error.cause,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to generate recipe',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
