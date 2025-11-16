import { RecipePromptBuilder } from '../../services/recipe/recipePromptBuilder';
import { ProductData } from '../../models/Product';
import { RecipeGenerationParams } from '../../types/recipe.types';
import { z } from 'zod';
import { TEST_CONSTANTS } from './__fixtures__/testConstants';

describe('RecipePromptBuilder', () => {
  let mockParams: RecipeGenerationParams;
  let mockProducts: ProductData[];

  beforeEach(() => {
    mockParams = JSON.parse(JSON.stringify(TEST_CONSTANTS.MOCK_PARAMS));
    mockProducts = JSON.parse(JSON.stringify(TEST_CONSTANTS.MOCK_PRODUCTS));
  });

  describe('buildPrompt', () => {
    it('should include all mandatory sections in the generated string', () => {
      // Arrange
      const themes = ['protein source'];
      const themesNotFound: string[] = [];

      // Act
      const result = RecipePromptBuilder.buildPrompt(
        mockParams,
        mockProducts,
        themes,
        themesNotFound
      );

      // Assert
      // Verify the main header exists
      expect(result).toContain(TEST_CONSTANTS.ASSERTIONS.CONTAINS.RECIPE_INSTRUCTIONS_HEADER);

      // Verify diet section integration
      expect(result).toContain(TEST_CONSTANTS.ASSERTIONS.CONTAINS.DIET_SECTION);

      // Verify nutrition section integration
      expect(result).toContain(`Minimum calories: ${TEST_CONSTANTS.MOCK_PARAMS.nutritionalGoals.minCalories}`);

      // Verify static JSON instructions are appended
      expect(result).toContain(TEST_CONSTANTS.ASSERTIONS.CONTAINS.RESPONSE_FORMAT);
    });

    it('should handle empty product list and trigger warning', () => {
      // Arrange
      const emptyProducts: ProductData[] = [];
      const themes = ['vegetable'];

      // Act
      const result = RecipePromptBuilder.buildPrompt(mockParams, emptyProducts, themes, []);

      // Assert
      // Check for the specific warning defined in buildAvailableIngredientsSection
      expect(result).toContain(TEST_CONSTANTS.ASSERTIONS.CONTAINS.WARNING_SECTION);
      expect(result).toContain(TEST_CONSTANTS.ASSERTIONS.CONTAINS.NO_PRODUCTS_WARNING);
    });

    it('should instruct to use generic ingredients for missing themes', () => {
      // Arrange
      const themes = ['rice'];
      const themesNotFound = ['rice'];

      // Act
      const result = RecipePromptBuilder.buildPrompt(
        mockParams,
        mockProducts,
        themes,
        themesNotFound
      );

      // Assert
      // Verify instructions for themes not found in database
      expect(result).toContain(TEST_CONSTANTS.ASSERTIONS.CONTAINS.GENERIC_INGREDIENTS);
      expect(result).toContain(TEST_CONSTANTS.ASSERTIONS.CONTAINS.GENERIC_INGREDIENT);
    });
  });

  describe('buildCorrectionPrompt', () => {
    it('should format Zod errors correctly', () => {
      // Arrange
      const zodError = new z.ZodError([
        {
          ...TEST_CONSTANTS.ERRORS.ZOD_ERROR,
        },
      ]);
      const invalidJson = TEST_CONSTANTS.ERRORS.INVALID_JSON;

      // Act
      const result = RecipePromptBuilder.buildCorrectionPrompt(zodError, invalidJson);

      // Assert
      // Expect specific Zod path formatting defined in the method
      expect(result).toContain('nutritionalInfo.calories : Expected number');
      expect(result).toContain('YOUR INVALID RESPONSE');
    });

    it('should handle standard Error objects', () => {
      // Arrange
      const error = new Error(TEST_CONSTANTS.ERRORS.GENERAL_ERROR);

      // Act
      const result = RecipePromptBuilder.buildCorrectionPrompt(error);

      // Assert
      expect(result).toContain(TEST_CONSTANTS.ERRORS.GENERAL_ERROR);
    });
  });

  describe('buildDietaryPreferencesSection', () => {
    it('should map known diets to their specific descriptions', () => {
      // Arrange
      const params = { 
        ...mockParams.preferences, 
        diet: 'keto' as const 
      };

      // Act
      const result = RecipePromptBuilder.buildDietaryPreferencesSection(params);

      // Assert
      // Verify mapping from DIET_DESCRIPTIONS
      expect(result).toContain(TEST_CONSTANTS.ASSERTIONS.CONTAINS.DIET_KETO_DESC);
      expect(result).toContain(TEST_CONSTANTS.ASSERTIONS.CONTAINS.DIET_KETO);
    });

    it('should handle optional parameters gracefully', () => {
      // Arrange
      const params = {
        diet: 'omnivore' as const,
        ingredientThemes: [],
        excludedIngredients: [],
      };

      // Act
      const result = RecipePromptBuilder.buildDietaryPreferencesSection(params);

      // Assert
      expect(result).toContain(TEST_CONSTANTS.ASSERTIONS.CONTAINS.NOT_SPECIFIED); // cookingTime
      expect(result).toContain(TEST_CONSTANTS.ASSERTIONS.CONTAINS.ANY); // difficulty
      expect(result).toContain(TEST_CONSTANTS.ASSERTIONS.CONTAINS.NONE); // excludedIngredients
    });
  });

  describe('buildNutritionalGoalsSection', () => {
    it('should format both min and max calories', () => {
      // Act
      const result = RecipePromptBuilder.buildNutritionalGoalsSection({
        minCalories: TEST_CONSTANTS.VALUES.MIN_CALORIES,
        maxCalories: TEST_CONSTANTS.VALUES.MAX_CALORIES,
      });

      // Assert
      expect(result).toContain(`- ${TEST_CONSTANTS.ASSERTIONS.CONTAINS.MIN_CALORIES}`);
      expect(result).toContain(`- ${TEST_CONSTANTS.ASSERTIONS.CONTAINS.MAX_CALORIES}`);
    });

    it('should handle missing nutritional goals', () => {
      // Act
      const result = RecipePromptBuilder.buildNutritionalGoalsSection({});

      // Assert
      expect(result).toContain(TEST_CONSTANTS.ASSERTIONS.CONTAINS.NO_CALORIE_GOALS);
    });
  });
});
