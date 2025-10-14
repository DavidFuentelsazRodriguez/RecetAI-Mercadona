import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/recetai-mercadona';

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
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error}`);
    process.exit(1);
  }
};


export const db = mongoose.connection;

db.on('error', (error) => {
  console.error(`Error connecting to MongoDB: ${error}`);
});

db.on('disconnected', () => {
  console.warn('Disconnected from MongoDB');
});

// Handle application close
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('Disconnected from MongoDB');
  process.exit(0);
});
