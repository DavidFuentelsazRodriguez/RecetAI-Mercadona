/**
 * A centralized object for generating dynamic error messages.
 * This maintains consistency and simplifies maintenance or translation.
 */
export const ErrorMessages = {
  valueBelowMin: (metricWithUnit: string, limit: number, actual: number): string =>
    `The recipe does not meet the minimum of ${limit} ${metricWithUnit}. Total: ${actual.toFixed(
      2
    )}`,

  valueAboveMax: (metricWithUnit: string, limit: number, actual: number): string =>
    `The recipe exceeds the maximum of ${limit} ${metricWithUnit}. Total: ${actual.toFixed(
      2
    )}`,

  missingTheme: (theme: string): string =>
    `The generated recipe does not include the required theme: ${theme}`,

  generationFailed: (error: unknown): string => {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return `Failed to generate the recipe: ${message}`;
  },
  jsonParseFailed: (error: unknown) =>
  `Error parsing Gemini's response as JSON. ${error instanceof Error ? error.message : ''}`,
 
  generationFailedAfterServeralAttempts: () =>
  'Failed to generate a valid recipe after several attempts.',
  
  cacheReadFailed: (error: unknown) =>
  `Failed to read from cache. ${error instanceof Error ? error.message : ''}`,

  cacheWriteFailed: (error: unknown) =>
  `Failed to write to cache. ${error instanceof Error ? error.message : ''}`,

  fetchFailed: (error: unknown) =>
  `Failed to fetch products. ${error instanceof Error ? error.message : ''}`,

  mongoURIUndefined: () =>
  'MONGODB_URI is not defined in environment variables',

  mongoConnectionError: (error: unknown) =>
  `Error connecting to MongoDB: ${error instanceof Error ? error.message : ''}`,

  mongoConnectionClosedError: (error: unknown) =>
  `Error closing MongoDB connection: ${error instanceof Error ? error.message : ''}`,

  failedToCleanProducts: () =>
  'Failed to clean products',

  failedToSyncProducts: () =>
  'Failed to sync products',

  failedToGetProducts: () =>
  'Failed to get products',

  failedToGetProductById: () =>
  'Failed to get product by id',
  
};