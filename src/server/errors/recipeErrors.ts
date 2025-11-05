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
