import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { connectDB } from './config/database';
import productsRouter from './routes/products';
import recipesRouter from './routes/recipes';
import logger from './config/logger';

const app: Express = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

app.use('/api', productsRouter);
app.use('/api', recipesRouter);

const startServer = async () => {
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

startServer();

export default app;
