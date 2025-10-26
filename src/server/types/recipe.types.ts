export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  sugar?: number; 
  fat: number;
  saturatedFat?: number;
  sodium?: number;
  fiber?: number;     
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface RecipeSuggestion {
  name: string;
  description: string;
  preparationTime: number;
  servings: number;
  difficulty: Difficulty;
  ingredients: Ingredient[];
  steps: string[];
  nutritionalInfo: NutritionalInfo;
  dietaryTags: string[];
}

export interface RecipeGenerationConfig {
  model: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
}

export const DEFAULT_RECIPE_CONFIG: RecipeGenerationConfig = {
  model: 'gpt-5',
  temperature: 0.7,
  max_tokens: 1500,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
};

export interface RecipeGenerationParams {
  preferences: {
    diet: 'vegan' | 'vegetarian' | 'omnivore' | 'gluten-free' | 'lactose-free' | 'keto' | 'low-carb' | 'high-protein' | 'high-fiber';
    excludedIngredients: string[];
    preferredIngredients: string[];
    cookingTime?: number; //in minutes
    difficulty?: 'easy' | 'medium' | 'hard';
  };
  nutritionalGoals: {
    maxCalories?: number;
    minProtein?: number;
    maxCarbs?: number;
    maxFat?: number;
  };
}
