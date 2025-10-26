import { Schema, model } from 'mongoose';

// Interfaz para los datos del producto (la usamos para todo)
export interface ProductData {
  name: string;
  brand?: string;
  imageUrl?: string;
  nutritionalInfo: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    saturatedFat?: number;
    sodium?: number;
  };
  isMercadona: boolean;
  lastUpdated: Date;
}

const ProductSchema = new Schema<ProductData>({
  name: { type: String, required: true, index: true },
  brand: { type: String },
  imageUrl: { type: String },
  nutritionalInfo: {
    calories: { type: Number, required: true },
    protein: { type: Number, required: true },
    carbs: { type: Number, required: true },
    fat: { type: Number, required: true },
    fiber: { type: Number },
    sugar: { type: Number },
    saturatedFat: { type: Number },
  },
  isMercadona: { type: Boolean, required: true, default: true },
  lastUpdated: { type: Date, default: Date.now },
});

export const Product = model<ProductData>('Product', ProductSchema);
