/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod';
import { RecipeGenerationParams, RecipeSuggestion } from '@/server/types/recipe.types';

const mockLean = jest.fn();
const mockLimit = jest.fn(() => ({ lean: mockLean }));
const mockFind = jest.fn(() => ({ limit: mockLimit }));

const mockRecipeCacheFindOne = jest.fn();
const mockRecipeCacheCreate = jest.fn();

const mockCreateGeminiChat = jest.fn();
const mockExtractJsonResponse = jest.fn();

const mockRecipeValidatorServiceValidate = jest.fn();

const mockRecipePromptBuilderBuildPrompt = jest.fn();
const mockRecipePromptBuilderBuildCorrectionPrompt = jest.fn();

const mockRecipeSuggestionSchemaParse = jest.fn();

const mockHandleGenerationError = jest.fn(() => {
    throw new Error('MOCK_HANDLE_ERROR');
});

jest.mock('../../models/product', () => ({
  Product: {
    find: mockFind,
  },
}));

jest.mock('../../models/RecipeCache', () => ({
  RecipeCache: {
    findOne: mockRecipeCacheFindOne,
    create: mockRecipeCacheCreate,
  },
}));

jest.mock('../../services/geminiService', () => ({
  createGeminiChat: mockCreateGeminiChat,
  extractJsonResponse: mockExtractJsonResponse,
}));
jest.mock('../recipe/recipeValidatorService', () => ({
  RecipeValidatorService: {
    validate: mockRecipeValidatorServiceValidate,
  },
}));

jest.mock('../recipe/recipePromptBuilder', () => ({
  RecipePromptBuilder: {
    buildPrompt: mockRecipePromptBuilderBuildPrompt,
    buildCorrectionPrompt: mockRecipePromptBuilderBuildCorrectionPrompt,
  },
}));

jest.mock('../../schemas/recipe.schemas', () => ({
  RecipeSuggestionSchema: {
    parse: mockRecipeSuggestionSchemaParse,
  },
}));

jest.mock('../../errors/recipeErrors', () => ({
    ...jest.requireActual('../../errors/recipeErrors'),
    handleGenerationError: mockHandleGenerationError,
}));

import { RecipeService } from '../../services/recipe/recipeService';
import { RecipeValidationError } from '../../errors/recipeErrors';
import { ErrorMessages } from '../../utils/validation';

const mockRecipeParams: RecipeGenerationParams = {
    preferences: { diet: 'low-fat', ingredientThemes: ['chicken'], excludedIngredients:[] },
    nutritionalGoals: { minCalories: 500 },
};

const mockValidRecipe: RecipeSuggestion = { 
    name: 'Low Fat Chicken',
    description: 'A low-fat chicken recipe',
    preparationTime: 30,
    servings: 4,
    difficulty: 'easy',
    ingredients: [],
    steps: [],
    nutritionalInfo: { calories: 500, protein: 20, carbs: 30, fat: 10 },
    dietaryTags: ['low-fat', 'chicken'],
};
const mockRawApiResponse = JSON.stringify(mockValidRecipe);

const mockGeminiChat = {
    sendMessage: jest.fn(() => ({
        response: {
            text: () => mockRawApiResponse,
        },
    })),
};

describe('RecipeService', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        mockCreateGeminiChat.mockReturnValue(mockGeminiChat);
        mockExtractJsonResponse.mockReturnValue(JSON.parse(mockRawApiResponse));
        mockRecipeSuggestionSchemaParse.mockReturnValue(mockValidRecipe);
        mockRecipePromptBuilderBuildPrompt.mockReturnValue('Generated Prompt');
        mockRecipePromptBuilderBuildCorrectionPrompt.mockReturnValue('Correction Prompt');

        mockLean.mockResolvedValue([{ name: 'chicken', _id: '1' }]);
        mockFind.mockReturnValue({ limit: mockLimit });
    });


    describe('generateRecipe (Cache Logic)', () => {
        
        it('should return cached recipe if CACHE HIT occurs', async () => {
            // Arrange
            const mockCachedRecipe = { key: 'hash', recipe: mockValidRecipe };
            mockRecipeCacheFindOne.mockResolvedValue(mockCachedRecipe);

            // Act
            const recipe = await RecipeService.generateRecipe(mockRecipeParams);

            // Assert
            expect(recipe).toEqual(mockCachedRecipe.recipe);
            // It should have read the cache, but not called the AI nor generation.
            expect(mockCreateGeminiChat).not.toHaveBeenCalled();
        });

        it('should generate, cache, and return new recipe if CACHE MISS occurs', async () => {
            // Arrange
            mockRecipeCacheFindOne.mockResolvedValue(null);
            
            const mockGenerateFromAI = jest.spyOn(RecipeService as any, 'generateRecipeFromAI');
            mockGenerateFromAI.mockResolvedValue(mockValidRecipe);

            // Act
            const recipe = await RecipeService.generateRecipe(mockRecipeParams);

            // Assert
            expect(recipe).toEqual(mockValidRecipe);
            // It should have called the generation and cache write.
            expect(mockGenerateFromAI).toHaveBeenCalledTimes(1);
            expect(mockRecipeCacheCreate).toHaveBeenCalledWith(
                expect.objectContaining({ recipe: mockValidRecipe })
            );

            mockGenerateFromAI.mockRestore();
        });

        it('should still generate recipe if cache read fails', async () => {
            // Arrange
            mockRecipeCacheFindOne.mockRejectedValue(new Error('DB connection closed'));
            
            const mockGenerateFromAI = jest.spyOn(RecipeService as any, 'generateRecipeFromAI');
            mockGenerateFromAI.mockResolvedValue(mockValidRecipe);
            
            // Act
            const recipe = await RecipeService.generateRecipe(mockRecipeParams);
            
            // Assert
            expect(recipe).toEqual(mockValidRecipe);
            expect(mockGenerateFromAI).toHaveBeenCalledTimes(1);
            
            mockGenerateFromAI.mockRestore();
        });

        it('should still return the generated recipe even if cache write fails', async () => {
            // Arrange
            mockRecipeCacheFindOne.mockResolvedValue(null);
            
            const mockGenerateFromAI = jest.spyOn(RecipeService as any, 'generateRecipeFromAI');
            mockGenerateFromAI.mockResolvedValue(mockValidRecipe);
            
            mockRecipeCacheCreate.mockRejectedValue(new Error('DB connection closed'));
            
            // Act
            const recipe = await RecipeService.generateRecipe(mockRecipeParams);
            
            // Assert
            expect(recipe).toEqual(mockValidRecipe);
            expect(mockRecipeCacheCreate).toHaveBeenCalledTimes(1);
            
            mockGenerateFromAI.mockRestore();
        });
    });

    describe('generateRecipeFromAI (AI Logic)', () => {
        
        it('should successfully generate and validate a recipe on the first attempt', async () => {
            // Arrange: All mocks default to returning valid values by default.
            
            // Act
            const recipeFromAI = await (RecipeService as any).generateRecipeFromAI(mockRecipeParams, 0);

            // Assert
            expect(recipeFromAI).toEqual(mockValidRecipe);
            expect(mockRecipePromptBuilderBuildPrompt).toHaveBeenCalledTimes(1);
            expect(mockRecipeValidatorServiceValidate).toHaveBeenCalledTimes(1);
            expect(mockRecipeValidatorServiceValidate).toHaveBeenCalledWith(
                mockValidRecipe,
                // We verify that the rule 'maxFat: 15' was applied
                expect.objectContaining({ nutritionalGoals: expect.objectContaining({ maxFat: 15 }) })
            );
        });
        
        it('should throw RecipeValidationError if MAX_RETRIES exceeded', async () => {
            // Act & Assert: Try with 3 retries (exceeds MAX_RETRIES = 2)
            await expect((RecipeService as any).generateRecipeFromAI(mockRecipeParams, 3)).rejects.toThrow(
                ErrorMessages.generationFailedAfterServeralAttempts()
            );
        });

        it('should retry generation if Zod parsing fails and call correction prompt logic', async () => {
            // Arrange
            mockRecipeSuggestionSchemaParse
                .mockImplementationOnce(() => { throw new z.ZodError([] as any); })
                .mockReturnValue(mockValidRecipe); // The second time it works

            const mockGenerateCorrection = jest.spyOn(RecipeService as any, 'generateRecipeWithCorrection');
            mockGenerateCorrection.mockResolvedValue(mockValidRecipe); 

            // Act
            const recipeFromAI = await (RecipeService as any).generateRecipeFromAI(mockRecipeParams, 0);

            // Assert
            expect(recipeFromAI).toEqual(mockValidRecipe);
            expect(mockRecipeSuggestionSchemaParse).toHaveBeenCalledTimes(1); 
            expect(mockRecipePromptBuilderBuildCorrectionPrompt).toHaveBeenCalledTimes(1); 
            expect(mockGenerateCorrection).toHaveBeenCalledTimes(1); 
            
            mockGenerateCorrection.mockRestore();
        });
        
        it('should throw the error if validation fails AND max retries is reached', async () => {
            // Arrange
            mockRecipeValidatorServiceValidate.mockImplementation(() => {
                throw new RecipeValidationError('Validation failed');
            });

            // Act & Assert
            await expect((RecipeService as any).generateRecipeFromAI(mockRecipeParams, 2)).rejects.toThrow(
                ErrorMessages.generationFailedAfterServeralAttempts()
            );
            expect(mockHandleGenerationError).not.toHaveBeenCalled(); // Should not wrap a RecipeValidationError
        });
        
        it('should apply the correct internal goals for "low-fat" diet', async () => {
            // Arrange
            mockRecipeValidatorServiceValidate.mockImplementation(() => {
                // Validation passes
            });

            // Act
            const recipeFromAI = await (RecipeService as any).generateRecipeFromAI(mockRecipeParams, 0);

            // Assert
            expect(mockRecipeValidatorServiceValidate).toHaveBeenCalledWith(
                recipeFromAI,
                expect.objectContaining({
                    nutritionalGoals: expect.objectContaining({ maxFat: 15, minCalories: 500 }),
                })
            );
        });

        it('should generate recipe if theme products length is equal or greater than PRODUCT_FETCH_LIMIT', async () => {
            // Arrange
            mockRecipeParams.preferences.ingredientThemes = Array.from({ length: RecipeService['PRODUCT_FETCH_LIMIT'] + 1 }, (_, i) => `Theme ${i}`);

            // Act
            const recipeFromAI = await (RecipeService as any).generateRecipeFromAI(mockRecipeParams, 0);

            // Assert
            expect(mockRecipeValidatorServiceValidate).toHaveBeenCalledWith(
                recipeFromAI,
                expect.objectContaining({
                    nutritionalGoals: expect.objectContaining({ maxFat: 15, minCalories: 500 }),
                })
            );
    
        });

        it('should call handleGenerationError if an error occurs and it is not an RecipeValidationError or ZodError', async () => {
            // Arrange
            mockRecipeValidatorServiceValidate.mockImplementation(() => {
                throw new Error('Something went wrong');
            });

            // Act & Assert
            await expect((RecipeService as any).generateRecipeFromAI(mockRecipeParams, 0)).rejects.toThrow(
                'MOCK_HANDLE_ERROR'
            );
            expect(mockHandleGenerationError).toHaveBeenCalledTimes(1);
        });
    });
});