import { gemini } from '../../config/gemini';
import { createGeminiChat, extractJsonResponse } from '../geminiService';
import { GeminiApiError } from '../../errors/recipeErrors';

jest.mock('../../config/gemini', () => {
  const mockStartChat = jest.fn();
  
  return {
    gemini: {
      recipeModel: {
        startChat: mockStartChat
      }
    }
  };
});

describe('Gemini Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createGeminiChat', () => {
    it('should call startChat on the recipe model', () => {
      const mockChatSession = { sendMessage: jest.fn() };
      (gemini.recipeModel.startChat as jest.Mock).mockReturnValue(mockChatSession);

      const result = createGeminiChat();

      expect(gemini.recipeModel.startChat).toHaveBeenCalledTimes(1);
      expect(gemini.recipeModel.startChat).toHaveBeenCalledWith();
      expect(result).toBe(mockChatSession);
    });
  });

  describe('extractJsonResponse', () => {
    it('should parse JSON from code block with json specifier', () => {
      const response = '```json\n{"key": "value"}\n```';
      const result = extractJsonResponse(response);
      expect(result).toEqual({ key: 'value' });
    });

    it('should parse JSON from code block without json specifier', () => {
      const response = '```\n{"key": "value"}\n```';
      const result = extractJsonResponse(response);
      expect(result).toEqual({ key: 'value' });
    });

    it('should parse plain JSON string', () => {
      const response = '{"key": "value"}';
      const result = extractJsonResponse(response);
      expect(result).toEqual({ key: 'value' });
    });

    it('should extract JSON from text containing JSON', () => {
      const response = 'Some text before\n{"key": "value"}\nSome text after';
      const result = extractJsonResponse(response);
      expect(result).toEqual({ key: 'value' });
    });

    it('should return the first item if response is an array', () => {
      const response = '[{"key1": "value1"}, {"key2": "value2"}]';
      const result = extractJsonResponse(response);
      expect(result).toEqual({ key1: 'value1' });
    });

    it('should throw GeminiApiError for invalid JSON', () => {
      const response = 'not a valid json';
      expect(() => extractJsonResponse(response)).toThrow(GeminiApiError);
    });

    it('should handle empty response', () => {
      const response = '';
      expect(() => extractJsonResponse(response)).toThrow(GeminiApiError);
    });
  });
});