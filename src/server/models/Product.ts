import { Schema, model } from 'mongoose';

type NutritionalInfo = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  saturatedFat?: number;
  sodium?: number;
  servingQuantity?: number;
  servingUnit?: string;
};

export interface ProductData {
  _id?: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  nutritionalInfo: NutritionalInfo;
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
    servingQuantity: { type: Number },
    servingUnit: { type: String },
  },
  lastUpdated: { type: Date, default: Date.now },
});

export const Product = model<ProductData>('Product', ProductSchema);
