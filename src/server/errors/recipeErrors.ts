import { ErrorMessages } from "../utils/validation";

/**
 * Error thrown when the validation structure or content
 * of a generated recipe by the AI fails.
 */
export class RecipeValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RecipeValidationError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RecipeValidationError);
    }
  }
}

/**
 * Error thrown when there is a problem communicating with the Gemini API
 * or processing its response (which is not a validation error).
 */
export class GeminiApiError extends Error {
  public rawApiResponse?: string;

  constructor(message: string, rawApiResponse?: string) {
    super(message);
    this.name = 'GeminiApiError';
    this.rawApiResponse = rawApiResponse;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GeminiApiError);
    }
  }
}


/**
 * Handles errors during recipe generation.
 * @param error The error that occurred
 * @param rawApiResponseText The raw API response text (optional)
 * @throws GeminiApiError If the error is not a RecipeValidationError or GeminiApiError
 */
export function handleGenerationError(error: unknown, rawApiResponseText?: string): never {
  if (error instanceof RecipeValidationError || error instanceof GeminiApiError) {
    throw error;
  }

  throw new GeminiApiError(ErrorMessages.generationFailed(error), rawApiResponseText);
}
