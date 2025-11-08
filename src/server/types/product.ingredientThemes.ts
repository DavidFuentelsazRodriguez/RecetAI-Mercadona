import { ProductData } from "../models";
import { Types } from "mongoose";

export type ThemeProduct = ProductData & {
  _id: Types.ObjectId;
  __v: number;
};