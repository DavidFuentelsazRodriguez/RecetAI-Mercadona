import { gemini } from '../config/gemini';
import { GeminiApiError } from '../errors/recipeErrors';
import { ErrorMessages } from '../utils/validation';


/**
 * Creates a chat session with the Gemini model.
 * @returns The chat session
 */
export function createGeminiChat() {
  return gemini.recipeModel.startChat();
}

/**
 * Extracts and parses JSON from the Gemini API response.
 * @param responseText The response text from the Gemini API
 * @returns The parsed JSON object
 * @throws GeminiApiError If the response cannot be parsed as JSON
 */
export function extractJsonResponse(responseText: string) {
  try {
    const jsonMatch = responseText.match(/```(?:json)?\n([\s\S]*?)\n```/) || [null, responseText];

    let jsonString = (jsonMatch[1] || jsonMatch[0] || '').trim();

    if (!jsonString.startsWith('{') && !jsonString.startsWith('[')) {
      const jsonInText = jsonString.match(/[{[].*[}\]]/s);
      if (jsonInText) {
        jsonString = jsonInText[0];
      }
    }

    const parsed = JSON.parse(jsonString);

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed[0];
    }

    return parsed;
  } catch (error) {
    throw new GeminiApiError(ErrorMessages.jsonParseFailed(error), responseText);
  }
}