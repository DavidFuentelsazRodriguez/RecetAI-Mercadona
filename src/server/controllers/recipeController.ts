import { Request, Response } from 'express';
import { RecipeService } from '../services/recipeService';
import { RecipeGenerationParams } from '../types/recipe.types';

/**
 * Generates a recipe based on the provided parameters
 */
export const generateRecipe = async (req: Request, res: Response) => {
  try {
    const params: RecipeGenerationParams = {
      preferences: {
        diet: req.body.preferences?.diet || 'omnivore',
        excludedIngredients: req.body.preferences?.excludedIngredients || [],
        ingredientThemes: req.body.preferences?.ingredientThemes || [],
        cookingTime: req.body.preferences?.cookingTime,
        difficulty: req.body.preferences?.difficulty,
      },
      nutritionalGoals: {
        minCalories: req.body.nutritionalGoals?.minCalories,
        maxCalories: req.body.nutritionalGoals?.maxCalories,
        minProtein: req.body.nutritionalGoals?.minProtein,
        maxCarbs: req.body.nutritionalGoals?.maxCarbs,
        maxFat: req.body.nutritionalGoals?.maxFat,
      },
    };

    const recipe = await RecipeService.generateRecipe(params);

    res.status(200).json({
      success: true,
      data: recipe,
    });
  } catch (error) {
    console.error('Error generating recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate recipe',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Gets the default recipe generation parameters
 */
export const getDefaultRecipeParams = (_req: Request, res: Response) => {
  try {
    const defaultParams: RecipeGenerationParams = {
      preferences: {
        diet: 'omnivore',
        excludedIngredients: [],
        ingredientThemes: [],
      },
      nutritionalGoals: {
        minCalories: 0,
        maxCalories: 0,
        minProtein: 0,
        maxCarbs: 0,
        maxFat: 0,
      },
    };

    res.status(200).json({
      success: true,
      data: defaultParams,
    });
  } catch (error) {
    console.error('Error getting default recipe params:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get default recipe parameters',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
