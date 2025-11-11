import {
  RecipeSuggestion,
  RecipeGenerationParams,
} from '../../types/recipe.types';
import { RecipeValidationError } from '../../errors/recipeErrors';
import { ErrorMessages } from '../../utils/validation';


export class RecipeValidatorService {
  
  /**
   * Validates that a generated recipe meets the specified requirements.
   * @param {RecipeSuggestion} recipe The generated recipe to validate.
   * @param {RecipeGenerationParams} params The recipe generation parameters.
   * @throws {RecipeValidationError} If the generated recipe does not meet the minimum or maximum nutritional goals.
   */
  public static validate(
    recipe: RecipeSuggestion,
    params: RecipeGenerationParams
  ) {
    this.validateIngredientThemes(recipe, params.preferences.ingredientThemes);

    const { nutritionalGoals } = params;
    const { minCalories, maxCalories, minProtein, maxCarbs, maxFat } =
      nutritionalGoals;
    const hasNutritionalGoals =
      minCalories || maxCalories || minProtein || maxCarbs || maxFat;

    if (hasNutritionalGoals) {
      this.validateNutrition(recipe.nutritionalInfo, nutritionalGoals);
    }
  }

  /**
   * Validates that the generated recipe includes all the mandatory ingredient themes.
   * @param {string[]} ingredientThemes An array of mandatory ingredient themes.
   * @param {RecipeSuggestion} recipe The generated recipe.
   * @throws {RecipeValidationError} If any of the mandatory themes are not found in the recipe.
   */
  private static validateIngredientThemes(
    recipe: RecipeSuggestion,
    ingredientThemes: string[]
  ) {
    if (!ingredientThemes || ingredientThemes.length === 0) {
      return;
    }

    for (const theme of ingredientThemes) {
      const themeLower = theme.toLowerCase();
      const foundMatch = recipe.ingredients.some(ingredient =>
        ingredient.name.toLowerCase().includes(themeLower)
      );

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
    const { minCalories, maxCalories, minProtein, maxCarbs, maxFat } = goals;

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
      throw new RecipeValidationError(
        ErrorMessages.valueAboveMax('g carbs', maxCarbs, carbs)
      );
    }
    if (maxFat && fat > maxFat) {
      throw new RecipeValidationError(
        ErrorMessages.valueAboveMax('g fat', maxFat, fat)
      );
    }
  }
}