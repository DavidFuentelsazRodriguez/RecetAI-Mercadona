import { connectDB } from './config/database';
import { createScraperWorker } from './config/queues';
import * as productsService from './services/productsService';
import logger from './config/logger';
import { Job } from 'bullmq';


const jobProcessor = async (job: Job) => {
  logger.info(`[WORKER] Starting job ${job.id}: Syncing products...`);
  
  const result = await productsService.syncProducts();
  
  return result;
};

const startWorker = async () => {
  try {
    await connectDB();
    createScraperWorker(jobProcessor);

  } catch (error) {
    logger.error('[WORKER] Fatal error starting worker: ',error);
    process.exit(1);
  }
};

startWorker();