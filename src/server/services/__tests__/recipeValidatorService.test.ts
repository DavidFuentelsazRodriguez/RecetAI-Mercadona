/* eslint-disable @typescript-eslint/no-explicit-any */
import { RecipeValidatorService } from '../recipe/recipeValidatorService';
import { RecipeSuggestion, RecipeGenerationParams } from '../../types/recipe.types';
import { RecipeValidationError } from '../../errors/recipeErrors';

describe('RecipeValidatorService', () => {
  const baseRecipe: RecipeSuggestion = {
    name: 'Test Recipe',
    description: 'A test recipe',
    preparationTime: 30,
    servings: 2,
    difficulty: 'medium',
    ingredients: [
      { name: 'chicken', quantity: 200, unit: 'g' },
      { name: 'rice', quantity: 150, unit: 'g' },
      { name: 'olive oil', quantity: 15, unit: 'ml' },
    ],
    steps: ['Step 1', 'Step 2'],
    nutritionalInfo: {
      calories: 500,
      protein: 40,
      carbs: 50,
      fat: 15,
      fiber: 5,
      sugar: 2,
      saturatedFat: 3,
      sodium: 800,
    },
    dietaryTags: [],
  };

  const baseParams: RecipeGenerationParams = {
    preferences: {
      diet: 'omnivore',
      excludedIngredients: [],
      ingredientThemes: [],
      cookingTime: 30,
      difficulty: 'medium',
    },
    nutritionalGoals: {},
  };

  describe('validate', () => {
    it('should not throw error when no validation rules are provided', () => {
      // Arrange
      const recipe = { ...baseRecipe };
      const params = { ...baseParams };

      // Act & Assert
      expect(() => RecipeValidatorService.validate(recipe, params)).not.toThrow();
    });

    it('should call validateIngredientThemes with correct parameters', () => {
      // Arrange
      const recipe = { ...baseRecipe };
      const params = {
        ...baseParams,
        preferences: {
          ...baseParams.preferences,
          ingredientThemes: ['chicken', 'rice'],
        },
      };

      // Create a spy on the prototype method
      const validateIngredientThemesSpy = jest.spyOn(
        RecipeValidatorService as any,
        'validateIngredientThemes'
      );

      // Act
      RecipeValidatorService.validate(recipe, params);

      // Assert
      expect(validateIngredientThemesSpy).toHaveBeenCalledWith(recipe, ['chicken', 'rice']);

      // Cleanup
      validateIngredientThemesSpy.mockRestore();
    });

    it('should call validateNutrition when nutritional goals are provided', () => {
      // Arrange
      const recipe = { ...baseRecipe };
      const params = {
        ...baseParams,
        nutritionalGoals: {
          minCalories: 400,
          maxCalories: 600,
          minProtein: 30,
          maxCarbs: 60,
          maxFat: 20,
        },
      };

      // Create a spy on the prototype method
      const validateNutritionSpy = jest.spyOn(
        RecipeValidatorService as any,
        'validateNutrition'
      );

      // Act
      RecipeValidatorService.validate(recipe, params);

      // Assert
      expect(validateNutritionSpy).toHaveBeenCalledWith(
        recipe.nutritionalInfo,
        params.nutritionalGoals
      );

      // Cleanup
      validateNutritionSpy.mockRestore();
    });

    it('should not call validateNutrition when no nutritional goals are provided', () => {
      // Arrange
      const recipe = { ...baseRecipe };
      const params = { ...baseParams, nutritionalGoals: {} };

      const validateNutritionSpy = jest.spyOn(
        RecipeValidatorService as any,
        'validateNutrition'
      );

      // Act
      RecipeValidatorService.validate(recipe, params);

      // Assert
      expect(validateNutritionSpy).not.toHaveBeenCalled();

      // Cleanup
      validateNutritionSpy.mockRestore();
    });

    it('should not throw when all validations pass', () => {
      // Arrange
      const recipe = { ...baseRecipe };
      const params = {
        ...baseParams,
        preferences: {
          ...baseParams.preferences,
          ingredientThemes: ['chicken', 'rice'],
        },
        nutritionalGoals: {
          minCalories: 400,
          maxCalories: 600,
          minProtein: 30,
          maxCarbs: 60,
          maxFat: 20,
        },
      };

      // Act & Assert
      expect(() => RecipeValidatorService.validate(recipe, params)).not.toThrow();
    });

    it('should throw RecipeValidationError when validateIngredientThemes fails', () => {
      // Arrange
      const recipe = { ...baseRecipe };
      const params = {
        ...baseParams,
        preferences: {
          ...baseParams.preferences,
          ingredientThemes: ['beef'], // Not in the recipe
        },
      };

      // Act & Assert
      expect(() => RecipeValidatorService.validate(recipe, params)).toThrow(RecipeValidationError);
    });

    it('should throw RecipeValidationError when validateNutrition fails', () => {
      // Arrange
      const recipe = {
        ...baseRecipe,
        nutritionalInfo: {
          ...baseRecipe.nutritionalInfo,
          calories: 700, // Exceeds maxCalories
        },
      };
      const params = {
        ...baseParams,
        nutritionalGoals: {
          maxCalories: 600,
        },
      };

      // Act & Assert
      expect(() => RecipeValidatorService.validate(recipe, params)).toThrow(RecipeValidationError);
    });
  });

  describe('validateNutrition', () => {
    const baseNutrition = {
      calories: 500,
      protein: 40,
      carbs: 50,
      fat: 15,
      fiber: 5,
      sugar: 2,
      saturatedFat: 3,
      sodium: 800,
    };

    it('should not throw error when nutrition meets all goals', () => {
      // Arrange
      const nutritionalInfo = { ...baseNutrition };
      const goals = {
        minCalories: 400,
        maxCalories: 600,
        minProtein: 30,
        maxCarbs: 60,
        maxFat: 20
      };

      // Act & Assert
      expect(() => 
        (RecipeValidatorService as any).validateNutrition(nutritionalInfo, goals)
      ).not.toThrow();
    });

    it('should throw error when calories are below minimum', () => {
      // Arrange
      const nutritionalInfo = { ...baseNutrition, calories: 350 };
      const goals = { minCalories: 400 };

      // Act & Assert
      expect(() => 
        (RecipeValidatorService as any).validateNutrition(nutritionalInfo, goals)
      ).toThrow(RecipeValidationError);
    });

    it('should throw error when calories are above maximum', () => {
      // Arrange
      const nutritionalInfo = { ...baseNutrition, calories: 650 };
      const goals = { maxCalories: 600 };

      // Act & Assert
      expect(() => 
        (RecipeValidatorService as any).validateNutrition(nutritionalInfo, goals)
      ).toThrow(RecipeValidationError);
    });

    it('should throw error when protein is below minimum', () => {
      // Arrange
      const nutritionalInfo = { ...baseNutrition, protein: 25 };
      const goals = { minProtein: 30 };

      // Act & Assert
      expect(() => 
        (RecipeValidatorService as any).validateNutrition(nutritionalInfo, goals)
      ).toThrow(RecipeValidationError);
    });

    it('should throw error when carbs are above maximum', () => {
      // Arrange
      const nutritionalInfo = { ...baseNutrition, carbs: 70 };
      const goals = { maxCarbs: 60 };

      // Act & Assert
      expect(() => 
        (RecipeValidatorService as any).validateNutrition(nutritionalInfo, goals)
      ).toThrow(RecipeValidationError);
    });

    it('should throw error when fat is above maximum', () => {
      // Arrange
      const nutritionalInfo = { ...baseNutrition, fat: 25 };
      const goals = { maxFat: 20 };

      // Act & Assert
      expect(() => 
        (RecipeValidatorService as any).validateNutrition(nutritionalInfo, goals)
      ).toThrow(RecipeValidationError);
    });

    it('should not throw when optional goals are not provided', () => {
      // Arrange
      const nutritionalInfo = { ...baseNutrition };
      const goals = {}; // No goals provided

      // Act & Assert
      expect(() => 
        (RecipeValidatorService as any).validateNutrition(nutritionalInfo, goals)
      ).not.toThrow();
    });
  });

  describe('validateIngredientThemes', () => {
    it('should not throw error when no ingredient themes are provided', () => {
      // Arrange
      const recipe = { ...baseRecipe };

      // Act & Assert
      expect(() => {
        RecipeValidatorService['validateIngredientThemes'](recipe, []);
      }).not.toThrow();
    });

    it('should not throw error when all ingredient themes are found', () => {
      // Arrange
      const recipe = {
        ...baseRecipe,
        ingredients: [
          { name: 'chicken breast', quantity: 200, unit: 'g' },
          { name: 'brown rice', quantity: 150, unit: 'g' },
          { name: 'olive oil', quantity: 15, unit: 'ml' },
        ],
      };
      const ingredientThemes = ['chicken', 'rice'];

      // Act & Assert
      expect(() => {
        RecipeValidatorService['validateIngredientThemes'](recipe, ingredientThemes);
      }).not.toThrow();
    });

    it('should be case insensitive when matching ingredient themes', () => {
      // Arrange
      const recipe = {
        ...baseRecipe,
        ingredients: [
          { name: 'Chicken Breast', quantity: 200, unit: 'g' },
          { name: 'Brown Rice', quantity: 150, unit: 'g' },
        ],
      };
      const ingredientThemes = ['CHICKEN', 'RICE'];

      // Act & Assert
      expect(() => {
        RecipeValidatorService['validateIngredientThemes'](recipe, ingredientThemes);
      }).not.toThrow();
    });

    it('should throw error when a required ingredient theme is missing', () => {
      // Arrange
      const recipe = {
        ...baseRecipe,
        ingredients: [
          { name: 'chicken', quantity: 200, unit: 'g' },
          { name: 'rice', quantity: 150, unit: 'g' },
        ],
      };
      const ingredientThemes = ['chicken', 'beef', 'rice'];

      // Act & Assert
      expect(() => {
        RecipeValidatorService['validateIngredientThemes'](recipe, ingredientThemes);
      }).toThrow(RecipeValidationError);
    });
  });
});
