import { Schema, model, IndexOptions } from 'mongoose';
import { RecipeSuggestion } from '../types/recipe.types';

export interface RecipeCacheData {
  key: string;
  recipe: RecipeSuggestion;
  createdAt: Date;
}

const RecipeCacheSchema = new Schema<RecipeCacheData>({
  key: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true  
  },
  recipe: { 
    type: Object, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
});

RecipeCacheSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 86400 }  as IndexOptions 
);

export const RecipeCache = model<RecipeCacheData>('RecipeCache', RecipeCacheSchema);