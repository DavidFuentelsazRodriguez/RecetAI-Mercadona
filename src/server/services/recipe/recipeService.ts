import { RecipeSuggestion, RecipeGenerationParams } from '../../types/recipe.types';
import { Product, type ProductData } from '../../models/product';
import { RecipeCache } from '../../models/RecipeCache';

import { createGeminiChat, extractJsonResponse } from '../geminiService';
import { RecipeSuggestionSchema } from '../../types/recipe.schemas';
import { RecipeValidationError } from '../../errors/recipeErrors';
import { RecipePromptBuilder } from './recipePromptBuilder';
import { z } from 'zod';
import objectHash from 'object-hash';
import { ThemeProduct } from '@/server/types/product.ingredientThemes';
import { RecipeValidatorService } from './recipeValidatorService';
import { handleGenerationError } from '../../errors/recipeErrors';

const DIET_TO_GOALS_MAP: Record<string, { minProtein?: number; maxCarbs?: number; maxFat?: number }> = {
  'low-fat': { maxFat: 15 },
  'low-carb': { maxCarbs: 25 },
  'high-protein': { minProtein: 30 },
  'keto': { maxCarbs: 10, maxFat: 60 },
};

export class RecipeService {
  private static readonly MAX_RETRIES = 2;
  private static readonly PRODUCT_FETCH_LIMIT = 158;

  /**
   * Generates a recipe from the AI model, retrying up to {@link MAX_RETRIES} times if the AI model does not produce a valid recipe.
   * If the AI model does not produce a valid recipe after {@link MAX_RETRIES} attempts, throws a RecipeValidationError.
   * The generated recipe is cached in the database to reduce the number of requests to the AI model.
   * @param params The recipe generation parameters.
   * @returns A promise that resolves to a valid recipe suggestion.
   */
  public static async generateRecipe(params: RecipeGenerationParams): Promise<RecipeSuggestion> {
    const cacheKey = this.createCacheKey(params);

    try {
      const cachedRecipe = await RecipeCache.findOne({ key: cacheKey });
      if (cachedRecipe) {
        return cachedRecipe.recipe;
      }
    } catch (cacheError) {
      console.error('Error reading cache:', cacheError);
    }

    const newRecipe = await this.generateRecipeFromAI(params, 0);

    try {
      await RecipeCache.create({
        key: cacheKey,
        recipe: newRecipe,
      });
    } catch (cacheError) {
      console.error('Error writing cache:', cacheError);
    }

    return newRecipe;
  }

  /**
   * Generates a recipe from the AI model, retrying up to {@link MAX_RETRIES} times if the AI model does not produce a valid recipe.
   * If the AI model does not produce a valid recipe after {@link MAX_RETRIES} attempts, throws a RecipeValidationError.
   * @param params The recipe generation parameters.
   * @param retryCount The current retry count. Defaults to 0.
   * @returns A promise that resolves to a valid recipe suggestion.
   */
  private static async generateRecipeFromAI(
    params: RecipeGenerationParams,
    retryCount: number = 0
  ): Promise<RecipeSuggestion> {
    if (retryCount > this.MAX_RETRIES) {
      throw new RecipeValidationError('Failed to generate a valid recipe after several attempts.');
    }
    const ingredientThemes = params.preferences.ingredientThemes;
    const {products, themesNotFound} = await this.fetchRelevantProducts(ingredientThemes);

    const originalPrompt = RecipePromptBuilder.buildPrompt(params, products, ingredientThemes, themesNotFound);
    let rawApiResponseText: string | undefined;

    try {
      const chat = createGeminiChat();
      const result = await chat.sendMessage(originalPrompt);
      rawApiResponseText = result.response.text();

      const rawRecipeObject = extractJsonResponse(rawApiResponseText);
      const validatedRecipe = RecipeSuggestionSchema.parse(rawRecipeObject);

      const internalValidationParams = JSON.parse(JSON.stringify(params));

      const dietKey = params.preferences.diet.toLowerCase().trim();

      // Search if the diet has nutritional goals rules
      const dietGoal = DIET_TO_GOALS_MAP[dietKey];

      if (dietGoal) {
        /*
         * Add the nutritional goals to the internal validation params
         * This combines user nutritional goals with the nutritional goals of the diet
         */
        Object.assign(internalValidationParams.nutritionalGoals, dietGoal);
      }

     RecipeValidatorService.validate(validatedRecipe, internalValidationParams);

      return validatedRecipe;
    } catch (error) {
      if (error instanceof z.ZodError || error instanceof RecipeValidationError) {
        console.warn(`Attempt ${retryCount + 1} failed. Retrying with automatic correction...`);
        console.warn('Captured error:', error.message);

        const correctionPrompt = RecipePromptBuilder.buildCorrectionPrompt(
          error,
          rawApiResponseText,
          originalPrompt
        );

        return this.generateRecipeWithCorrection(
          params,
          products,
          correctionPrompt,
          retryCount + 1
        );
      }
      return handleGenerationError(error, rawApiResponseText);
    }
  }

  /**
   * Fetches products from the database that match the provided ingredient themes.
   * First, it fetches products that match the ingredient themes up to a limit of {@link PRODUCT_FETCH_LIMIT}.
   * If the limit is not reached, it fetches additional products that do not match the ingredient themes,
   * up to the remaining limit.
   * @param ingredientThemes An array of ingredient themes to match against product names.
   * @returns A promise that resolves to an array of product data objects.
   */
  private static async fetchRelevantProducts(ingredientThemes: string[]): Promise<{products: ProductData[], themesNotFound: string[]}> {
    try {
      const query = this.buildProductQuery(ingredientThemes);

      const themeProducts = await Product.find(query).limit(this.PRODUCT_FETCH_LIMIT).lean();

      const themesNotFound = getNotFoundThemes(ingredientThemes, themeProducts);

      const remainingLimit = this.PRODUCT_FETCH_LIMIT - themeProducts.length;

      if (remainingLimit <= 0) {
        return {products: themeProducts, themesNotFound};
      }

      const excludeIds = themeProducts.map(p => p._id);

      const additionalProducts = await Product.find({
        _id: { $nin: excludeIds },
      })
        .limit(remainingLimit)
        .lean();

      return {products: [...themeProducts, ...additionalProducts], themesNotFound};
    } catch (error) {
      console.error('Error fetching products:', error);
      return {products: [], themesNotFound: ingredientThemes};
    }
  }

  /**
   * Builds a MongoDB query to find products with names that match the provided ingredient themes.
   * If no themes are provided, an empty query object is returned.
   * @param themes An array of ingredient themes to match against product names.
   * @returns A MongoDB query object.
   */
  private static buildProductQuery(themes: string[]): Record<string, unknown> {
    const query: Record<string, unknown> = {};

    if (themes && themes.length > 0) {
      query.name = { $regex: themes.join('|'), $options: 'i' };
    }

    return query;
  }

  /**
   * Generates a recipe from the AI model with a correction prompt.
   * This function is used when the AI model generates an invalid recipe.
   * The correction prompt is built by including the error details, the invalid response snippet, and the original instructions.
   * If the AI model still fails to generate a valid recipe after the correction prompt, the function will retry generating the recipe with the original prompt.
   * @param params The recipe generation parameters.
   * @param products The available products from the database.
   * @param correctionPrompt The correction prompt for the AI model.
   * @param retryCount The current retry count.
   * @returns A promise that resolves to a valid recipe suggestion.
   */
  private static async generateRecipeWithCorrection(
    params: RecipeGenerationParams,
    products: ProductData[],
    correctionPrompt: string,
    retryCount: number
  ): Promise<RecipeSuggestion> {
    let rawApiResponseText: string | undefined;
    try {
      const chat = createGeminiChat();
      const result = await chat.sendMessage(correctionPrompt);
      rawApiResponseText = result.response.text();

      const rawRecipeObject = extractJsonResponse(rawApiResponseText);
      const validatedRecipe = RecipeSuggestionSchema.parse(rawRecipeObject);

      RecipeValidatorService.validate(validatedRecipe, params);

      return validatedRecipe;
    } catch (finalError) {
      console.error('Final error:', finalError);
      return this.generateRecipeFromAI(params, retryCount);
    }
  }

  private static createCacheKey(params: RecipeGenerationParams): string {
    return objectHash(params, { algorithm: 'sha1' });
  }
}

function getNotFoundThemes(ingredientThemes: string[], themeProducts: ThemeProduct[]) {
  const foundThemes = new Set<string>();
  if (ingredientThemes.length > 0) {
    themeProducts.forEach(p => {
      const productNameLower = p.name.toLowerCase();
      ingredientThemes.forEach(theme => {
        if (productNameLower.includes(theme.toLowerCase())) {
          foundThemes.add(theme.toLowerCase());
        }
      });
    });
  }

  return ingredientThemes.filter(t => !foundThemes.has(t.toLowerCase()));
}

