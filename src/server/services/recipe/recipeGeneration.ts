import { gemini } from '../../config/gemini';
import { RecipeSuggestion, RecipeGenerationParams } from '../../types/recipe.types';
import { RecipeValidationError, GeminiApiError } from '../../errors/recipeErrors';
import { ErrorMessages } from '../../utils/validation';
import { ProductData } from '../../models/Product';

/**
 * Creates a chat session with the Gemini model.
 * @returns The chat session
 */
export function createGeminiChat() {
  return gemini.recipeModel.startChat();
}

/**
 * Extracts and parses JSON from the Gemini API response.
 * @param responseText The response text from the Gemini API
 * @returns The parsed JSON object
 * @throws GeminiApiError If the response cannot be parsed as JSON
 */
export function extractJsonResponse(responseText: string) {
  try {
    const jsonMatch = responseText.match(/```(?:json)?\n([\s\S]*?)\n```/) || [null, responseText];

    let jsonString = (jsonMatch[1] || jsonMatch[0] || '').trim();

    if (!jsonString.startsWith('{') && !jsonString.startsWith('[')) {
      const jsonInText = jsonString.match(/[{[].*[}\]]/s);
      if (jsonInText) {
        jsonString = jsonInText[0];
      }
    }

    const parsed = JSON.parse(jsonString);

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed[0];
    }

    return parsed;
  } catch (error) {
    throw new GeminiApiError(ErrorMessages.jsonParseFailed(error), responseText);
  }
}

/**
 * Validates that the generated recipe meets the nutritional requirements specified in the recipe generation parameters.
 * @param recipe The generated recipe
 * @param ingredientThemes The ingredient themes that were used in the recipe
 * @param params The recipe generation parameters
 * @throws RecipeValidationError If the generated recipe does not meet the minimum or maximum calorie requirements
 */
export function validateNutritionalRequirements(
  recipe: RecipeSuggestion,
  allProducts: ProductData[],
  params: RecipeGenerationParams
) {
  const { ingredientThemes } = params.preferences;
  validateIngredientThemes(ingredientThemes, recipe);

  const { minCalories, maxCalories, minProtein, maxCarbs, maxFat } = params.nutritionalGoals;

  const hasNutritionalGoals = minCalories || maxCalories || minProtein || maxCarbs || maxFat;
  if (!hasNutritionalGoals) {
    return;
  }

  validateNutritionFromAI(recipe.nutritionalInfo, params.nutritionalGoals);
}

/**
 * Validates that the generated recipe includes all the mandatory ingredient themes.
 * @param ingredientThemes An array of mandatory ingredient themes
 * @param recipe The generated recipe
 * @throws RecipeValidationError If any of the mandatory themes are not found in the recipe
 */
function validateIngredientThemes(ingredientThemes: string[], recipe: RecipeSuggestion) {
  if (ingredientThemes && ingredientThemes.length > 0) {
    for (const theme of ingredientThemes) {
      const themeLower = theme.toLowerCase();

      // Check if at least one ingredient contains the theme
      const foundMatch = recipe.ingredients.some(ingredient =>
        ingredient.name.toLowerCase().includes(themeLower)
      );

      if (!foundMatch) {
        throw new RecipeValidationError(ErrorMessages.missingTheme(theme));
      }
    }
  }
}

/**
 * Handles errors during recipe generation.
 * @param error The error that occurred
 * @param rawApiResponseText The raw API response text (optional)
 * @throws GeminiApiError If the error is not a RecipeValidationError or GeminiApiError
 */
export function handleGenerationError(error: unknown, rawApiResponseText?: string): never {
  if (error instanceof RecipeValidationError || error instanceof GeminiApiError) {
    throw error;
  }

  throw new GeminiApiError(ErrorMessages.generationFailed(error), rawApiResponseText);
}

/**
 * Validates that a generated recipe meets the specified nutritional goals.
 * @param recipe The generated recipe
 * @param minProtein The minimum number of grams of protein the generated recipe must have (optional)
 * @param maxCarbs The maximum number of grams of carbohydrates the generated recipe must have (optional)
 * @param maxFat The maximum number of grams of fat the generated recipe must have (optional)
 * @throws RecipeValidationError If the generated recipe does not meet the minimum or maximum nutritional goals
 * @returns The total number of calories in the generated recipe
 */
function validateNutritionFromAI(
  nutritionalInfo: RecipeSuggestion['nutritionalInfo'],
  goals: RecipeGenerationParams['nutritionalGoals']
): void {
  const { calories, protein, carbs, fat } = nutritionalInfo;
  const { minCalories, maxCalories, minProtein, maxCarbs, maxFat } = goals;

  if (minCalories && calories < minCalories) {
    throw new RecipeValidationError(ErrorMessages.valueBelowMin('calories', minCalories, calories));
  }

  if (maxCalories && calories > maxCalories) {
    throw new RecipeValidationError(ErrorMessages.valueAboveMax('calories', maxCalories, calories));
  }

  if (minProtein && protein < minProtein) {
    throw new RecipeValidationError(ErrorMessages.valueBelowMin('g protein', minProtein, protein));
  }
  if (maxCarbs && carbs > maxCarbs) {
    throw new RecipeValidationError(ErrorMessages.valueAboveMax('g carbs', maxCarbs, carbs));
  }

  if (maxFat && fat > maxFat) {
    throw new RecipeValidationError(ErrorMessages.valueAboveMax('g fat', maxFat, fat));
  }
}
