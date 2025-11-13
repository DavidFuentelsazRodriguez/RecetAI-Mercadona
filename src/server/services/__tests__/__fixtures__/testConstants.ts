export const TEST_CONSTANTS = {
  // Mock data for RecipeGenerationParams
  MOCK_PARAMS: {
    preferences: {
      diet: 'vegan',
      excludedIngredients: ['sugar'],
      ingredientThemes: ['protein source'],
      cookingTime: 30,
      difficulty: 'easy',
    },
    nutritionalGoals: {
      minCalories: 300,
      maxCalories: 600,
    },
  } as const,

  // Mock product data
  MOCK_PRODUCTS: [
    {
      id: '1',
      name: 'Tofu',
      brand: 'SoyGood',
      nutritionalInfo: { 
        calories: 76, 
        protein: 8, 
        carbs: 1.9, 
        fat: 4.8 
      },
      lastUpdated: new Date(),
    },
  ] as const,

  // Test messages and assertions
  ASSERTIONS: {
    CONTAINS: {
      RECIPE_INSTRUCTIONS_HEADER: '## RECIPE GENERATION INSTRUCTIONS',
      DIET_SECTION:'- **Diet type**: vegan',
      NUTRITION_SECTION: 'Minimum calories: 300',
      RESPONSE_FORMAT: 'REQUIRED RESPONSE FORMAT (VALID JSON)',
      WARNING_SECTION: '#### WARNING',
      NO_PRODUCTS_WARNING: 'No products found in the database',
      GENERIC_INGREDIENTS: 'Generic Ingredients',
      GENERIC_INGREDIENT: 'rice (generic)',
      DIET_KETO_DESC: 'Must be very low in carbs',
      DIET_KETO: '- **Diet type**: keto',
      NOT_SPECIFIED: 'Not specified',
      ANY: 'Any',
      NONE: 'None',
      MIN_CALORIES: 'Minimum calories: 100',
      MAX_CALORIES: 'Maximum calories: 200',
      NO_CALORIE_GOALS: 'No specific calorie goals specified',
    },
  } as const,

  // Test data for error cases
  ERRORS: {
    ZOD_ERROR: {
      code: 'invalid_type' as const,
      expected: 'number' as const,
      received: 'string' as const,
      path: ['nutritionalInfo', 'calories'] as PropertyKey[],
      message: 'Expected number, received string',
    },
    INVALID_JSON: '{"foo": "bar"}',
    GENERAL_ERROR: 'General failure',
  } as const,

  // Test values
  VALUES: {
    MIN_CALORIES: 100,
    MAX_CALORIES: 200,
  } as const,
};
