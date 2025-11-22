/* eslint-disable security/detect-object-injection */
import { RecipeSuggestion, RecipeGenerationParams } from '../../types/recipe.types';
import { Product, type ProductData } from '../../models/Product';
import { RecipeCache } from '../../models/RecipeCache';

import { createGeminiChat, extractJsonResponse } from '../geminiService';
import { RecipeSuggestionSchema } from '../../schemas/recipe.schemas';
import { RecipeValidationError } from '../../errors/recipeErrors';
import { RecipePromptBuilder } from './recipePromptBuilder';
import { z } from 'zod';
import objectHash from 'object-hash';
import { RecipeValidatorService } from './recipeValidatorService';
import { handleGenerationError } from '../../errors/recipeErrors';
import { ErrorMessages } from '../../utils/validation';
import logger from '../../config/logger';
import { searchProductsByTheme } from '../vectorStoreService';

const DIET_TO_GOALS_MAP: Record<
  string,
  { minProtein?: number; maxCarbs?: number; maxFat?: number; minCarbs?: number }
> = {
  'low-fat': { maxFat: 15 },
  'low-carb': { maxCarbs: 25 },
  'high-protein': { minProtein: 30 },
  'pre-workout': { minCarbs: 40, maxFat: 15 },
  keto: { maxCarbs: 10, maxFat: 60 },
};

interface FetchProductsResult {
  products: ProductData[];
  themesNotFound: string[];
  themeMatches: Record<string, string[]>;
}

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
      logger.error('Error reading cache:', cacheError);
    }

    const newRecipe = await this.generateRecipeFromAI(params, 0);

    try {
      await RecipeCache.create({
        key: cacheKey,
        recipe: newRecipe,
      });
    } catch (cacheError) {
      logger.error('Error writing cache:', cacheError);
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
      throw new RecipeValidationError(ErrorMessages.generationFailedAfterServeralAttempts());
    }
    const ingredientThemes = params.preferences.ingredientThemes;
    const { products, themesNotFound, themeMatches } =
      await this.fetchRelevantProducts(ingredientThemes);

    const originalPrompt = RecipePromptBuilder.buildPrompt(
      params,
      products,
      ingredientThemes,
      themesNotFound
    );
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
      const dietGoal = Object.hasOwn(DIET_TO_GOALS_MAP, dietKey)
        ? DIET_TO_GOALS_MAP[dietKey as keyof typeof DIET_TO_GOALS_MAP]
        : undefined;

      if (dietGoal) {
        /*
         * Add the nutritional goals to the internal validation params
         * This combines user nutritional goals with the nutritional goals of the diet
         */
        Object.assign(internalValidationParams.nutritionalGoals, dietGoal);
      }

      RecipeValidatorService.validate(validatedRecipe, internalValidationParams, themeMatches);

      return validatedRecipe;
    } catch (error) {
      if (error instanceof z.ZodError || error instanceof RecipeValidationError) {
        const correctionPrompt = RecipePromptBuilder.buildCorrectionPrompt(
          error,
          rawApiResponseText,
          originalPrompt
        );

        return this.generateRecipeWithCorrection(
          params,
          products,
          correctionPrompt,
          retryCount + 1,
          themeMatches
        );
      }
      return handleGenerationError(error, rawApiResponseText);
    }
  }

  /**
   * Fetches products from the database that match the given ingredient themes.
   * If no products are found for a theme, the theme is added to the themesNotFound array.
   * The function also fetches random products from the database to complete the limit of {@link PRODUCT_FETCH_LIMIT}.
   * @param ingredientThemes The ingredient themes to search for in the database.
   * @returns A promise that resolves to an object containing an array of all products, including the found products and the random products, and an array of themes that were not found in the database.
   */
  private static async fetchRelevantProducts(
    ingredientThemes: string[]
  ): Promise<FetchProductsResult> {
    const foundProductsMap = new Map<string, ProductData>();
    const themesNotFound: string[] = [];
    const themeMatches: Record<string, string[]> = {};

    await setFoundProductsMap(ingredientThemes, foundProductsMap, themesNotFound, themeMatches);

    const allProducts: ProductData[] = await RecipeService.setRemainingProducts(foundProductsMap);

    return { products: allProducts, themesNotFound, themeMatches };
  }

  /**
   * Fetches the remaining products from the database that are not yet in the foundProductsMap
   * up to the limit of {@link PRODUCT_FETCH_LIMIT}.
   * If the number of products in foundProductsMap is less than the limit, random products are fetched
   * from the database to complete the limit.
   * @param foundProductsMap The map of found products
   * @returns A promise that resolves to an array of all products, including the found products and the random products.
   */
  private static async setRemainingProducts(foundProductsMap: Map<string, ProductData>) {
    let allProducts: ProductData[] = Array.from(foundProductsMap.values());

    const remainingLimit = this.PRODUCT_FETCH_LIMIT - allProducts.length;
    if (remainingLimit > 0) {
      const excludeIds = allProducts.map(p => (p as ProductData)._id);
      const randomProducts = await Product.find({ _id: { $nin: excludeIds } })
        .limit(remainingLimit)
        .lean();
      allProducts = [...allProducts, ...randomProducts];
    }
    return allProducts;
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
    retryCount: number,
    themeMatches: Record<string, string[]>
  ): Promise<RecipeSuggestion> {
    let rawApiResponseText: string | undefined;
    try {
      const chat = createGeminiChat();
      const result = await chat.sendMessage(correctionPrompt);
      rawApiResponseText = result.response.text();

      const rawRecipeObject = extractJsonResponse(rawApiResponseText);
      const validatedRecipe = RecipeSuggestionSchema.parse(rawRecipeObject);

      RecipeValidatorService.validate(validatedRecipe, params, themeMatches);

      return validatedRecipe;
    } catch (finalError) {
      logger.error('Final error:', finalError);
      return this.generateRecipeFromAI(params, retryCount);
    }
  }

  private static createCacheKey(params: RecipeGenerationParams): string {
    return objectHash(params, { algorithm: 'sha1' });
  }
}

/**
 * Sets the found products map and the themes not found array.
 * For each ingredient theme, it searches for products in the vector store.
 * If products are found, it sets the found products map and the theme matches record.
 * If no products are found, it adds the theme to the themes not found array.
 * @param ingredientThemes The ingredient themes to search for in the vector store.
 * @param foundProductsMap The map of found products.
 * @param themesNotFound The array of themes that were not found in the vector store.
 * @param themeMatches The record of theme matches.
 */
async function setFoundProductsMap(
  ingredientThemes: string[],
  foundProductsMap: Map<string, ProductData>,
  themesNotFound: string[],
  themeMatches: Record<string, string[]>
) {
  for (const theme of ingredientThemes) {
    try {
      const vectorResults = await searchProductsByTheme(theme, 50);

      if (vectorResults.length > 0) {
        const shuffledResults = vectorResults.sort(() => 0.5 - Math.random()).slice(0, 10);

        const ids = shuffledResults.map(r => r.id);

        const productsFromDb = await Product.find({ _id: { $in: ids } }).lean();
        themeMatches[theme] = productsFromDb.map(p => p.name);
        productsFromDb.forEach(p => foundProductsMap.set(p._id.toString(), p));
      } else {
        themesNotFound.push(theme);
      }
    } catch (error) {
      logger.error(`Error searching vector for theme ${theme}`, error);
      themesNotFound.push(theme);
    }
  }
}
