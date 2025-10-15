import { Document, Schema, model, Types } from 'mongoose';

interface IIngredient {
  productId: Types.ObjectId;
  name: string;
  quantity: number;
  unit: string;
}

interface IRecipe extends Document {
  name: string;
  description: string;
  preparationTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  ingredients: IIngredient[];
  steps: string[];
  nutritionalInfo: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  dietaryTags: string[];
  createdAt: Date;
}

const IngredientSchema = new Schema<IIngredient>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
});

const RecipeSchema = new Schema<IRecipe>({
  name: { type: String, required: true, index: true },
  description: { type: String, required: true },
  preparationTime: { type: Number, required: true, min: 1 },
  servings: { type: Number, required: true, min: 1 },
  difficulty: {
    type: String,
    required: true,
    enum: ['easy', 'medium', 'hard'],
  },
  ingredients: [IngredientSchema],
  steps: [{ type: String, required: true }],
  nutritionalInfo: {
    calories: { type: Number, required: true, min: 0 },
    protein: { type: Number, required: true, min: 0 },
    carbs: { type: Number, required: true, min: 0 },
    fat: { type: Number, required: true, min: 0 },
  },
  dietaryTags: [{ type: String, index: true }],
  createdAt: { type: Date, default: Date.now },
});

export const Recipe = model<IRecipe>('Recipe', RecipeSchema);
