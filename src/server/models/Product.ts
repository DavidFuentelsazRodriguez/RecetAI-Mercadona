import { Schema, model } from 'mongoose';

// Interfaz para los datos del producto (la usamos para todo)
export interface ProductData {
  name: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
  nutritionalInfo: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    saturatedFat?: number;
    transFat?: number;
    cholesterol?: number;
    sodium?: number;
    potassium?: number;
    calcium?: number;
    iron?: number;
    magnesium?: number;
    phosphorus?: number;
    zinc?: number;
    vitaminA?: number;
    vitaminC?: number;
    vitaminD?: number;
    vitaminE?: number;
    vitaminK?: number;
    vitaminB12?: number;
  };
  isMercadona: boolean;
  lastUpdated: Date;
}

const ProductSchema = new Schema<ProductData>({
  name: { type: String, required: true, index: true },
  brand: { type: String },
  category: { type: String, index: true },
  imageUrl: { type: String },
  nutritionalInfo: {
    calories: { type: Number, required: true },
    protein: { type: Number, required: true },
    carbs: { type: Number, required: true },
    fat: { type: Number, required: true },
    fiber: { type: Number },
    sugar: { type: Number },
    saturatedFat: { type: Number },
    transFat: { type: Number },
    cholesterol: { type: Number },
    sodium: { type: Number },
    potassium: { type: Number },
    calcium: { type: Number },
    iron: { type: Number },
    magnesium: { type: Number },
    phosphorus: { type: Number },
    zinc: { type: Number },
    vitaminA: { type: Number },
    vitaminC: { type: Number },
    vitaminD: { type: Number },
    vitaminE: { type: Number },
    vitaminK: { type: Number },
    vitaminB12: { type: Number },
  },
  isMercadona: { type: Boolean, required: true, default: true },
  lastUpdated: { type: Date, default: Date.now },
});

export const Product = model<ProductData>('Product', ProductSchema);
