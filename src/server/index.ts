import express, { Express } from 'express';
import cors from 'cors';
import { connectDB } from './config/database';
import productsRouter from './routes/products';
import recipesRouter from './routes/recipes';
import logger from './config/logger';

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for getting client IP
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', productsRouter);
app.use('/api', recipesRouter);

export const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('Error starting server:', error);
    process.exit(1);
  }
};

export default app;
