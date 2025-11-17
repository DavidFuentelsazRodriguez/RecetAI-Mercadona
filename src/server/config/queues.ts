import { Job, Queue, Worker } from 'bullmq';
import { Redis, RedisOptions } from 'ioredis';
import logger from './logger';


const redisConfig: RedisOptions = {
  host: process.env.REDIS_HOST || 'redis',
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
};

const connection = new Redis(redisConfig);

export const SCRAPER_QUEUE_NAME = 'scraper-queue';

export const scrapingQueue = new Queue(SCRAPER_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3, // Number of retries if job fails
    backoff: {
      type: 'exponential',
      delay: 5000, // Wait 5 seconds before first retry
    },
  },
});

export const createScraperWorker = (processor: (job: Job) => Promise<unknown>) => {
  const worker = new Worker(SCRAPER_QUEUE_NAME, processor, { connection });

  worker.on('completed', job => {
    logger.info(`[WORKER] Job ${job.id} (syncProducts) completed.`);
  });

  worker.on('failed', (job, err) => {
    logger.error(err.message, `[WORKER] Job ${job?.id} (syncProducts) failed.`);
  });

  logger.info(`[WORKER] Worker started. Listening queue: ${SCRAPER_QUEUE_NAME}`);
  return worker;
};