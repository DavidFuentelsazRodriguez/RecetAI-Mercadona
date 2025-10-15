import mongoose from 'mongoose';
import { Product } from '../models';
import { Recipe } from '../models';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

// Enable debug mode in development
if (process.env.NODE_ENV === 'development') {
  mongoose.set('debug', true);
}

/**
 * Establishes a connection to the MongoDB database
 */
export const connectDB = async (): Promise<void> => {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`🛢️  MongoDB connected: ${conn.connection.host}`);
    
    // Register models
    mongoose.model('Product', Product.schema);
    mongoose.model('Recipe', Recipe.schema);
    
    console.log('📦 Database models registered');
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error}`);
    process.exit(1);
  }
};

// Export models and connection for easy access
export const db = {
  Product,
  Recipe,
  connection: mongoose.connection,
};

// Handle connection events
db.connection.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});

db.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

// Handle application close
process.on('SIGINT', async () => {
  try {
    await db.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    process.exit(1);
  }
});
