/* eslint-disable security/detect-object-injection */
import { RecipeSuggestion, RecipeGenerationParams } from '../../types/recipe.types';
import { RecipeValidationError } from '../../errors/recipeErrors';
import { ErrorMessages } from '../../utils/validation';
import logger from '../../config/logger';

export class RecipeValidatorService {
  public static validate(
    recipe: RecipeSuggestion,
    params: RecipeGenerationParams,
    themeMatches?: Record<string, string[]>
  ) {
    this.validateIngredientThemes(recipe, params.preferences.ingredientThemes, themeMatches);

    const { nutritionalGoals } = params;
    const { minCalories, maxCalories, minProtein, maxCarbs, maxFat } = nutritionalGoals;
    const hasNutritionalGoals = minCalories || maxCalories || minProtein || maxCarbs || maxFat;

    if (hasNutritionalGoals) {
      this.validateNutrition(recipe.nutritionalInfo, nutritionalGoals);
    }
  }

  /**
   * Validates if the given recipe contains at least one product that matches each of the given ingredient themes.
   * If a theme match is provided, it will be used to semantically validate the recipe.
   * If no theme match is provided, the recipe will be validated using a simple text search.
   * @throws {RecipeValidationError} if any of the ingredient themes are not found in the recipe.
   */
  private static validateIngredientThemes(
    recipe: RecipeSuggestion,
    ingredientThemes: string[],
    themeMatches?: Record<string, string[]>
  ) {
    if (!ingredientThemes || ingredientThemes.length === 0) {
      return;
    }

    for (const theme of ingredientThemes) {
      const themeLower = theme.toLowerCase();
      let foundMatch = false;

      if (themeMatches && themeMatches[themeLower] && themeMatches[themeLower].length > 0) {
        foundMatch = RecipeValidatorService.semanticValidation(themeMatches, themeLower, recipe);
      } else {
        logger.warn(
          `Cannot strictly validate the theme '${themeLower}' (without products in DB). Accepting recipe.`
        );
        foundMatch = true;
      }

      if (!foundMatch) {
        throw new RecipeValidationError(ErrorMessages.missingTheme(theme));
      }
    }
  }

  /**
   * Validates that the nutritional information from the AI meets the specified goals.
   * @param {RecipeSuggestion['nutritionalInfo']} nutritionalInfo The nutritional information from the AI.
   * @param {RecipeGenerationParams['nutritionalGoals']} goals The nutritional goals.
   * @throws {RecipeValidationError} If the nutritional information does not meet the nutritional goals.
   */
  private static validateNutrition(
    nutritionalInfo: RecipeSuggestion['nutritionalInfo'],
    goals: RecipeGenerationParams['nutritionalGoals']
  ) {
    const { calories, protein, carbs, fat } = nutritionalInfo;
    const { minCalories, maxCalories, minProtein, maxCarbs, maxFat, minCarbs } = goals;

    if (minCalories && calories < minCalories) {
      throw new RecipeValidationError(
        ErrorMessages.valueBelowMin('calories', minCalories, calories)
      );
    }
    if (maxCalories && calories > maxCalories) {
      throw new RecipeValidationError(
        ErrorMessages.valueAboveMax('calories', maxCalories, calories)
      );
    }
    if (minProtein && protein < minProtein) {
      throw new RecipeValidationError(
        ErrorMessages.valueBelowMin('g protein', minProtein, protein)
      );
    }
    if (maxCarbs && carbs > maxCarbs) {
      throw new RecipeValidationError(ErrorMessages.valueAboveMax('g carbs', maxCarbs, carbs));
    }

    if (minCarbs && carbs < minCarbs) {
      throw new RecipeValidationError(
        ErrorMessages.valueBelowMin('g carbs', minCarbs, carbs)
      );
    }
    
    if (maxFat && fat > maxFat) {
      throw new RecipeValidationError(ErrorMessages.valueAboveMax('g fat', maxFat, fat));
    }
  }

  private static semanticValidation(
    themeMatches: Record<string, string[]>,
    theme: string,
    recipe: RecipeSuggestion
  ): boolean {
    const validProductNames = themeMatches[theme].map(n => n.toLowerCase());

    return recipe.ingredients.some(ingredient => {
      const ingName = ingredient.name.toLowerCase();

      const ingWords = ingName.split(/[\s()]+/).filter(w => w.length > 2);

      const isMatch = validProductNames.some(validName => {
        const validWords = validName.split(/[\s()]+/).filter(w => w.length > 2);

        const matchingWords = ingWords.filter(word => validWords.includes(word));

        if (validWords.length === 1) {
          return matchingWords.length >= 1;
        }
        return matchingWords.length >= 2;
      });

      return isMatch;
    });
  }
}
