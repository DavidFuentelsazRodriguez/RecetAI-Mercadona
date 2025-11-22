import { ProductData } from '../../models/Product';
import { RecipeGenerationParams } from '../../types/recipe.types';
import { z } from 'zod';

export class RecipePromptBuilder {
  private static readonly DIET_DESCRIPTIONS: Record<
    RecipeGenerationParams['preferences']['diet'],
    string
  > = {
    vegan: 'Must be 100% plant-based, no animal products including honey, dairy, or eggs.',
    vegetarian: 'May include dairy and eggs but no meat, poultry, or fish.',
    keto: 'Must be very low in carbs (under 10g net carbs per serving).',
    omnivore: 'May include all food groups including meat, dairy, and plant-based ingredients.',
    'gluten-free': 'Must not contain wheat, barley, rye, or any gluten sources.',
    'lactose-free': 'Must not contain lactose or dairy products.',
    'low-fat': 'Must be low in total fat, avoiding greasy or oily ingredients.',
    'low-carb': 'Must be low in carbohydrates, avoiding sugar, bread, and pasta.',
    'high-protein':
      'Must be high in protein, prioritizing ingredients like chicken, tofu, or legumes.',
    'high-fiber':
      'Must be high in fiber, prioritizing rich fiber sources like oats, beans, or nuts.',
    'pre-workout':
      'Must be high in easily digestible carbohydrates for energy. Moderate protein, low fat and low fiber to avoid digestive issues during exercise.',
  };

  private static readonly STATIC_PROMPT_INSTRUCTIONS = `
    ### REQUIRED RESPONSE FORMAT (VALID JSON)
    \`\`\`json
    {
      "name": "string",
      "description": "string",
      "preparationTime": number,
      "servings": number,
      "difficulty": "easy" | "medium" | "hard",
      "ingredients": [
        {
          "name": "string",
          "quantity": number,
          "unit": "string"
        }
      ],
      "steps": ["string"],
      "nutritionalInfo": {
        "calories": number,
        "protein": number,
        "carbs": number,
        "fat": number,
        "sugar": number,
        "saturatedFat": number,
        "sodium": number,
        "fiber": number
      },
      "dietaryTags": ["string"]
    }
    \`\`\`
    
    ### STRICT RULES (MUST BE FOLLOWED)
    1.  **VALID JSON**: The response MUST be a single JSON code block. Do not include any text before or after.
    2.  **INGREDIENTS**:
        - You MUST base the recipe on ingredients from the "AVAILABLE INGREDIENT DATABASE".
        - You MUST satisfy all "MANDATORY INGREDIENT THEMES" by selecting at least one matching product from the list for each theme.
        - All quantities and units are required.
    3.  **NUTRITION**:
        - The generated nutritional information (calories, protein, etc.) MUST be a realistic calculation based on the provided ingredients and their quantities.
        - It MUST meet the defined NUTRITIONAL GOALS.
    4.  **DIFFICULTY**: Must be "easy", "medium", or "hard".
    5.  **LANGUAGE**: Output MUST be in **SPANISH**. Use correct grammar and capitalization.
    6.  **UNITS**: 
        - For weight, use "g" or "kg".
        - For countable items (eggs, tortillas, fruits, cans), you MUST use "unidades".
        - Do NOT use "ml", "tbsp", "tsp".
    ### VALID EXAMPLE:
    \`\`\`json
    {
      "name": "quinoa salad with chicken breast",
      "description": "Fresh salad using quinoa and chicken breast from the list.",
      "preparationTime": 25,
      "servings": 2,
      "difficulty": "easy",
      "ingredients": [
        {"name": "quinoa (Hacendado)", "quantity": 100, "unit": "g"},
        {"name": "chicken breast (PolloFeliz)", "quantity": 150, "unit": "g"},
        {"name": "tomato", "quantity": 1, "unit": "unit"},
        {"name": "olive oil", "quantity": 1, "unit": "tablespoon"}
      ],
      "steps": ["Cook the quinoa", "Chop the vegetables", "Cook the chicken"],
      "nutritionalInfo": {
        "calories": 450,
        "protein": 30,
        "carbs": 40,
        "fat": 20,
        "fiber": 6
      },
      "dietaryTags": ["high protein", "gluten free"]
    }
    \`\`\`
    
    ### FINAL INSTRUCTIONS
    Generate the recipe. Remember: your response must be ONLY the JSON block, and it must follow ALL the rules, especially using ingredients from the lists and meeting the nutritional goals.
    `;

  /**
   * Builds a prompt for the AI model to generate a recipe.
   * The prompt includes sections for dietary preferences, nutritional goals, ingredient themes, available ingredients, and static instructions.
   * @param params The recipe generation parameters.
   * @param products The available products from the database.
   * @param ingredientThemes The ingredient themes to match against product names.
   * @param themesNotFound The ingredient themes that were not found in the database.
   * @returns A string containing the prompt for the AI model.
   */
  public static buildPrompt(
    params: RecipeGenerationParams,
    products: ProductData[],
    ingredientThemes: string[],
    themesNotFound: string[]
  ): string {
    const { preferences, nutritionalGoals } = params;

    const dietSection = this.buildDietaryPreferencesSection(preferences);
    const nutritionSection = this.buildNutritionalGoalsSection(nutritionalGoals);
    const themesSection = this.buildIngredientThemesSection(ingredientThemes, themesNotFound);
    const ingredientsSection = this.buildAvailableIngredientsSection(products, ingredientThemes);

    const promptParts = [
      '## RECIPE GENERATION INSTRUCTIONS',
      'Your task is to generate a recipe in SPANISH that STRICTLY meets all the requirements.',
      dietSection,
      nutritionSection,
      themesSection,
      ingredientsSection,
      this.STATIC_PROMPT_INSTRUCTIONS,
    ];

    return promptParts.join('\n\n');
  }

  /**
   * Builds a correction prompt for the AI model to correct a recipe generation attempt.
   * The prompt includes the error details, the invalid response snippet, and the original instructions.
   * @param error The error that occurred during the recipe generation attempt.
   * @param invalidResponse The invalid response text (optional).
   * @param originalPrompt The original instructions for the recipe generation attempt (optional).
   * @returns A string containing the correction prompt for the AI model.
   */
  public static buildCorrectionPrompt(
    error: Error,
    invalidResponse?: string,
    originalPrompt?: string
  ): string {
    let errorDetails = '';
    if (error instanceof z.ZodError) {
      errorDetails = error.issues.map(e => `${e.path.join('.')} : ${e.message}`).join('; ');
    } else {
      errorDetails = error.message;
    }

    const cleanInvalidResponse = invalidResponse
      ? invalidResponse.replace(/\\n/g, '\n').substring(0, 1000)
      : 'No response text captured.';

    return `
Your previous response failed a validation rule.
You MUST correct your response based on the error.

## THE ERROR YOU MADE
${errorDetails}

## YOUR INVALID RESPONSE (snippet)
\`\`\`json
${cleanInvalidResponse}...
\`\`\`

## ORIGINAL INSTRUCTIONS (Follow ALL of them)
${originalPrompt}

Please review your calculations and ingredient list. You MUST provide ONLY the corrected, valid JSON block.
  `;
  }

  public static buildDietaryPreferencesSection(
    preferences: RecipeGenerationParams['preferences']
  ): string {
    const dietInstruction =
      this.DIET_DESCRIPTIONS[preferences.diet] || 'No specific dietary restrictions.';

    return `
  ### DIETARY PREFERENCES
  - **Diet type**: ${preferences.diet} (${dietInstruction})
  - **Ingredients to avoid**: ${preferences.excludedIngredients.join(', ') || 'None'}
  - **Cooking time**: ${preferences.cookingTime ? `${preferences.cookingTime} minutes` : 'Not specified'}
  - **Difficulty**: ${preferences.difficulty || 'Any'}
  `.trim();
  }

  public static buildNutritionalGoalsSection(
    nutritionalGoals: RecipeGenerationParams['nutritionalGoals']
  ): string {
    const { minCalories, maxCalories, minCarbs } = nutritionalGoals;

    const lines = [
      minCalories ? `- Minimum calories: ${minCalories}` : null,
      maxCalories ? `- Maximum calories: ${maxCalories}` : null,
      minCarbs ? `- Minimum carbohydrates: ${minCarbs}g (CRITICAL for energy)` : null,
    ];

    const validLines = lines.filter(Boolean);

    const content =
      validLines.length > 0 ? validLines.join('\n') : 'No specific calorie goals specified.';

    return `
  ### NUTRITIONAL GOALS (Per serving)
  ${content}
  `.trim();
  }

  private static buildIngredientThemesSection(
    allThemes: string[],
    themesNotFound: string[]
  ): string {
    if (allThemes.length === 0) {
      return '';
    }

    const themesFound = allThemes.filter(
      t => !themesNotFound.find(notFound => notFound.toLowerCase() === t.toLowerCase())
    );

    let section = '### MANDATORY INGREDIENT THEMES\n';

    if (themesFound.length > 0) {
      section +=
        '**From Database:** You MUST include at least one product from the "AVAILABLE" list for each of these themes:\n';
      section += themesFound.map(theme => `- ${theme}`).join('\n') + '\n';
    }

    if (themesNotFound.length > 0) {
      section +=
        '\n**Generic Ingredients:** The following themes were NOT found in the database. You MUST add them to the recipe as a "generic" ingredient (e.g., "lechuga", "tomate").\n';
      section +=
        'You MUST also **estimate their nutritional info** and include it in the total `nutritionalInfo` calculation to meet the goals.\n';
      section += themesNotFound.map(theme => `- ${theme} (generic)`).join('\n');
    }

    return section.trim();
  }

  private static buildAvailableIngredientsSection(
    products: ProductData[],
    ingredientThemes: string[]
  ): string {
    const formattedProducts = this.formatProducts(products);
    const hasProducts = products.length > 0;
    const hasThemes = ingredientThemes.length > 0;

    const warning =
      !hasProducts && hasThemes
        ? '#### WARNING\nNo products found in the database. Generate a generic recipe using common ingredients that match the mandatory themes.\n'
        : '';

    return `
  ### AVAILABLE INGREDIENT DATABASE
  Here are the ingredients from the database you can use to build the recipe:
  ${formattedProducts}
  
  ${warning}
  `.trim();
  }

  private static formatProducts(products: ProductData[]): string {
    if (products.length === 0) {
      return 'No specific products available. Use common ingredients.';
    }

    return products
      .map(
        p =>
          `- ${p.name}${p.brand ? ` (${p.brand})` : ''} | ` +
          `Calories: ${p.nutritionalInfo?.calories || 'N/A'} | ` +
          `Protein: ${p.nutritionalInfo?.protein || 'N/A'}g | ` +
          `Carbs: ${p.nutritionalInfo?.carbs || 'N/A'}g | ` +
          `Fat: ${p.nutritionalInfo?.fat || 'N/A'}g`
      )
      .join('\n');
  }
}
