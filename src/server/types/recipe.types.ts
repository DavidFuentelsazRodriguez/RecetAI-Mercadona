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

export interface RecipeGenerationParams {
  preferences: {
    diet: 'vegan' | 'vegetarian' | 'omnivore' | 'gluten-free' | 'lactose-free' | 'keto' | 'low-carb' | 'high-protein' | 'high-fiber' | 'low-fat';
    excludedIngredients: string[];
    ingredientThemes: string[];
    cookingTime?: number; //in minutes
    difficulty?: 'easy' | 'medium' | 'hard';
  };
  nutritionalGoals: {
    minCalories?: number;
    maxCalories?: number;
    minProtein?: number;
    maxCarbs?: number;
    maxFat?: number;
  };
}
