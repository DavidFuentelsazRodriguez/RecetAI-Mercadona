import { ProductData } from "../models/Product";
import { Types } from "mongoose";

export type ThemeProduct = ProductData & {
  _id: Types.ObjectId;
  __v: number;
};