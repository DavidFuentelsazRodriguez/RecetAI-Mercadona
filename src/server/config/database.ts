import mongoose from 'mongoose';
import { Product } from '../models/product';
import { Recipe } from '../models/recipe';
import logger from './logger';
import dotenv from 'dotenv';
import { ErrorMessages } from '../utils/validation';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (process.env.NODE_ENV === 'development') {
  mongoose.set('debug', true);
}

export const connectDB = async (): Promise<void> => {
  try {
    if (!MONGODB_URI) {
      throw new Error(ErrorMessages.mongoURIUndefined());
    }

    const conn = await mongoose.connect(MONGODB_URI, {
      dbName: 'recetAI',
    });
    logger.info(`🛢️  MongoDB connected: ${conn.connection.host}`);

    mongoose.model('Product', Product.schema);
    mongoose.model('Recipe', Recipe.schema);

    logger.info('📦 Database models registered');
  } catch (error) {
    logger.error(ErrorMessages.mongoConnectionError(error));
    process.exit(1);
  }
};

export const db = {
  Product,
  Recipe,
  connection: mongoose.connection,
};

db.connection.on('error', error => {
  logger.error(ErrorMessages.mongoConnectionError(error));
});

db.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});


process.on('SIGINT', async () => {
  try {
    await db.connection.close();
    logger.info('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (error) {
    logger.error(ErrorMessages.mongoConnectionClosedError(error));
    process.exit(1);
  }
});
