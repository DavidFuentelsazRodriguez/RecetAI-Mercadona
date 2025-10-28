import { z } from 'zod';

export const IngredientSchema = z.object({
  name: z.string().min(1, { error: "Ingredient name cannot be empty" }),
  quantity: z.number({ error: "Quantity must be a number" }),
  unit: z.string().min(1, { error: "Unit cannot be empty" }),
});

export const NutritionalInfoSchema = z.object({
  calories: z.number({ error: "Calories must be a number" }).min(0, {error: "Calories must be greater or equal 0"}),
  protein: z.number({ error: "Protein must be a number" }).min(0, {error: "Protein must be greater or equal 0"}),
  carbs: z.number({ error: "Carbs must be a number" }).min(0, {error: "Carbs must be greater or equal 0"}),
  fat: z.number({ error: "Fat must be a number" }).min(0, {error: "Fat must be greater or equal 0"}),
  sugar: z.number({ error: "Sugar must be a number" }).min(0, {error: "Sugar must be greater or equal 0"}).optional(),
  saturatedFat: z.number({ error: "Saturated fat must be a number" }).min(0, {error: "Saturated fat must be greater or equal 0"}).optional(),
  sodium: z.number({ error: "Sodium must be a number" }).min(0, {error: "Sodium must be greater or equal 0"}).optional(),
  fiber: z.number({ error: "Fiber must be a number" }).min(0, {error: "Fiber must be greater or equal 0"}).optional(),
});

export const RecipeSuggestionSchema = z.object({
  name: z.string().min(1, { error: "Recipe name cannot be empty" }),
  description: z.string().min(1, { error: "Description cannot be empty" }),
  preparationTime: z.number({ error: "Preparation time is required" }).int({ error: "Preparation time must be an integer" }).positive({ error: "Preparation time must be positive" }),
  servings: z.number({ error: "Servings are required" }).int({ error: "Servings must be an integer" }).positive({ error: "Servings must be positive" }),
  difficulty: z.enum(['easy', 'medium', 'hard'], { error: "Difficulty is required" }),
  ingredients: z.array(IngredientSchema).min(1, { error: "Recipe must include at least one ingredient" }),
  steps: z.array(z.string().min(1, { error: "Steps cannot be empty strings" })).min(1, { error: "Recipe must include at least one step" }),
  nutritionalInfo: NutritionalInfoSchema,
  dietaryTags: z.array(z.string()), 
});


export type ValidatedRecipeSuggestion = z.infer<typeof RecipeSuggestionSchema>;