import { Schema, model } from 'mongoose';

// Interfaz para los datos del producto (la usamos para todo)
export interface ProductData {
  name: string;
  brand: string;
  category: string;
  imageUrl?: string;
  price: number;
  unit: string;
  nutritionalInfo: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  isMercadona: boolean;
  lastUpdated: Date;
}

const ProductSchema = new Schema<ProductData>({
  name: { type: String, required: true, index: true },
  brand: { type: String, required: true },
  category: { type: String, required: true, index: true },
  imageUrl: { type: String },
  price: { type: Number, required: true },
  unit: { type: String, required: true },
  nutritionalInfo: {
    calories: { type: Number, required: true },
    protein: { type: Number, required: true },
    carbs: { type: Number, required: true },
    fat: { type: Number, required: true },
  },
  isMercadona: { type: Boolean, required: true, default: false },
  lastUpdated: { type: Date, default: Date.now },
});

export const Product = model<ProductData>('Product', ProductSchema);
