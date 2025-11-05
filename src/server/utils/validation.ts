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
  `Error al parsear la respuesta de Gemini como JSON. ${error instanceof Error ? error.message : ''}`,
};