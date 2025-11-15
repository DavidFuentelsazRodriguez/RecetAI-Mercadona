import rateLimit from 'express-rate-limit';
import logger from './logger';


/**
 * Express rate limiter for recipe generation from AI
 * Limits to 10 requests per 5 minutes.
 */
export const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, 
  max: 10,
  message: { success: false, message: 'Too many requests, please wait.' },
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit (API) reached by IP ${req.ip} in ${req.originalUrl}`);
    res.status(options.statusCode).json(options.message);
  }
});

/**
 * Express rate limiter for scraper 
 * Limits to 2 requests per hour.
 */
export const scraperLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 2,
  message: { success: false, message: 'The synchronization can only be executed twice per hour.' },
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit (Scraper) reached by IP ${req.ip} in ${req.originalUrl}`);
    res.status(options.statusCode).json(options.message);
  }
});