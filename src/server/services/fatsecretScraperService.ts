/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import * as cheerio from 'cheerio';
import { ProductData } from '../models/Product';

const BASE_URL = 'https://www.fatsecret.es/calor%C3%ADas-nutrici%C3%B3n/search';
const SEARCH_QUERY = 'Mercadona';

const parseNutritionValue = (value: string | undefined): number | undefined => {
  if (!value) return undefined;
  const parsed = parseFloat(value.replace(/[^0-9.,]/g, '').replace(',', '.'));
  return isNaN(parsed) ? undefined : parsed;
};

/**
 * Extracts the nutrition data from a given HTML content.
 * @param {cheerio.CheerioAPI} $ - The HTML content to parse.
 * @returns {any} The nutrition data object if basic nutrition info (calories, protein, carbs, fat) is found, null otherwise.
 */
const extractNutritionInfo = ($: cheerio.CheerioAPI): any | null => {
  const nutritionData: any = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  };

  let foundBasicNutrition = false;

  const nutritionContainer = $('.nutrition_facts.eu');

  if (nutritionContainer.length === 0) {
    return null;
  }

  extractServingSizeText(nutritionContainer, nutritionData);

  const nutrients = nutritionContainer.find('.nutrient.left.w1');

  if (nutrients.length === 0) {
    return null;
  }

  nutrients.each((_i, element) => {
    foundBasicNutrition = processNutritionLabel($, element, nutritionData, foundBasicNutrition);
  });

  return foundBasicNutrition ? nutritionData : null
};

/**
 * Fetches the nutrition data from a given product URL.
 * @param productUrl URL of the product
 * @returns Promise that resolves to the nutrition data (if found) or null (if not found or an error occurs)
 */
const getProductNutrition = async (productUrl: string): Promise<any | null> => {
  try {
    const response = await axios.get(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    return extractNutritionInfo($);
  } catch (error) {
    console.error(`Error fetching nutrition data from ${productUrl}:`, error);
    return null;
  }
};

/**
 * Fetches all products from a given page number on FatSecret Spain.
 * @param page Page number to fetch products from (1-indexed)
 * @returns Promise that resolves to an array of objects containing the product name and URL
 */
const getProductsFromPage = async (page: number): Promise<any[]> => {
  try {
    const url = page === 1 ? `${BASE_URL}?q=${SEARCH_QUERY}` : `${BASE_URL}?q=${SEARCH_QUERY}&pg=${page}`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const products: any[] = [];

    $('a.prominent[href*="/calor%C3%ADas-nutrici%C3%B3n/mercadona/"]').each((_, element) => {
      const href = $(element).attr('href');
      const text = $(element).text().trim();

      if (href && text && !href.includes('search') && text.length > 0) {
        const fullUrl = href.startsWith('http') ? href : `https://www.fatsecret.es${href}`;
        products.push({
          name: text,
          url: fullUrl,
        });
      }
    });

    return products;
  } catch (error) {
    console.error(`Error fetching products from page ${page}:`, error);
    return [];
  }
};

/**
 * Checks if the next page exists.
 * @param currentPage Current page number (1-indexed)
 * @returns Promise that resolves to a boolean indicating whether the next page exists
 */
const hasNextPage = async (currentPage: number): Promise<boolean> => {
  try {
    const nextPageUrl = `${BASE_URL}?q=${SEARCH_QUERY}&pg=${currentPage + 1}`;
    
    const response = await axios.get(nextPageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
      },
      timeout: 15000,
      validateStatus: (status: number) => status < 500,
    });
    
    if (response.status === 404) {
      console.log(`❌ Page ${currentPage + 1} does not exist (404)`);
      return false;
    }

    const $ = cheerio.load(response.data);
    
    const products = $('a[href*="/calor%C3%ADas-nutrici%C3%B3n/mercadona/"]').length;
    
    const nextPageLink = $(`a:contains("Siguiente"), a:contains("Next")`).first();
    const hasNextPageLink = nextPageLink.length > 0 && 
                          nextPageLink.attr('href') !== undefined && 
                          !nextPageLink.hasClass('disabled');
    
    const pageHasProducts = products > 0;
    const result = pageHasProducts || hasNextPageLink;
    
    return Boolean(result);
    
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      console.error(`❌ Error checking page ${currentPage + 1}: ${error.response.status} ${error.response.statusText}`);
    } else if (error instanceof Error) {
      console.error(`❌ Error checking page ${currentPage + 1}:`, error.message);
    } else {
      console.error(`❌ Unknown error checking page ${currentPage + 1}`);
    }
    return false;
  }
};



/**
 * Fetches all products from FatSecret Spain with the 'Mercadona' brand.
 * This function will iterate through all pages of the product list and fetch the nutrition data for each product.
 * It will then return an array of objects containing the product name, brand, category, nutritional information, whether it is a Mercadona product, and the last updated date.
 * @returns Promise that resolves to an array of objects containing the product data.
 */
export const getMercadonaProductsFromFatSecret = async (): Promise<ProductData[]> => {
  const allProducts: ProductData[] = [];
  let currentPage = 1;
  let hasMorePages = true;

  try {
    while (hasMorePages) {
      const products = await getProductsFromPage(currentPage);

      if (products.length === 0) {
        break;
      }

      for (const product of products) {
        try {
          const nutrition = await getProductNutrition(product.url);

          if (nutrition) {
            const productData: ProductData = {
              name: product.name,
              brand: 'Mercadona',
              nutritionalInfo: nutrition,
              lastUpdated: new Date(),
            };

            allProducts.push(productData);          }
        } catch (error) {
          console.error(`❌ Error processing product: ${product?.name}`, error);
        }
      }

      hasMorePages = await hasNextPage(currentPage);
      if (hasMorePages) {
        currentPage++;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    return allProducts;
  } catch (error) {
    console.error('❌ Error in getMercadonaProductsFromFatSecret:', error);
    return allProducts;
  }
};

/**
 * Processes a nutrition label element and its value, and updates the nutritionData object if a match is found.
 * @param {cheerio.CheerioAPI} $ - The cheerio object to parse the HTML with.
 * @param {any} element - The nutrition label element to process.
 * @param {any} nutritionData - The object to update with the extracted nutrition data.
 * @param {boolean} foundBasicNutrition - Whether basic nutrition data (calories, protein, carbs, fat) has already been found.
 * @returns {boolean} Whether basic nutrition data has been found.
 */
function processNutritionLabel($: cheerio.CheerioAPI, element: any, nutritionData: any, foundBasicNutrition: boolean): boolean {
  const $label = $(element);
  const label = $label.text().trim().toLowerCase();

  // The value is in the next sibling with class tRight w2
  const $value = $label.next('.tRight.w2');
  const value = $value.text().trim();

  if (value && label) {

    // Check for specific nutrients
    if (label.includes('energía') || label.includes('energia')) {
      const kcalMatch = value.match(/(\d+(?:[.,]\d+)?)\s*kcal/i);
      if (kcalMatch) {
        nutritionData.calories = parseFloat(kcalMatch[1].replace(',', '.'));
        foundBasicNutrition = true;
      } else {
        // If no kcal found, try kj and convert to kcal (1 kcal = 4.184 kj)
        const kjMatch = value.match(/(\d+(?:[.,]\d+)?)\s*kj/i);
        if (kjMatch) {
          const kj = parseFloat(kjMatch[1].replace(',', '.'));
          nutritionData.calories = Math.round((kj / 4.184) * 10) / 10;
          foundBasicNutrition = true;
        }
      }
    }
    else if (label.includes('proteína') || label.includes('proteinas') || label.includes('proteina')) {
      const protein = parseNutritionValue(value);
      if (protein !== undefined) {
        nutritionData.protein = protein;
        foundBasicNutrition = true;
      }
    }
    else if (label.includes('carbohidrato')) {
      const carbs = parseNutritionValue(value);
      if (carbs !== undefined) {
        nutritionData.carbs = carbs;
        foundBasicNutrition = true;
      }
    }
    else if (label.includes('grasa') && !label.includes('saturada')) {
      const fat = parseNutritionValue(value);
      if (fat !== undefined) {
        nutritionData.fat = fat;
        foundBasicNutrition = true;
      }
    }
    else if (label.includes('grasa saturada')) {
      const saturatedFat = parseNutritionValue(value);
      if (saturatedFat !== undefined) {
        nutritionData.saturatedFat = saturatedFat;
      }
    }
    else if (label.includes('azúcar') || label.includes('azucar')) {
      const sugar = parseNutritionValue(value);
      if (sugar !== undefined) {
        nutritionData.sugar = sugar;
      }
    }
    else if (label.includes('fibra')) {
      const fiber = parseNutritionValue(value);
      if (fiber !== undefined) {
        nutritionData.fiber = fiber;
      }
    }
    else if (label.includes('sal') || label.includes('sodio')) {
      const sodium = parseNutritionValue(value);
      if (sodium !== undefined) {
        nutritionData.sodium = sodium;
      }
    }
  }
  return foundBasicNutrition;
}

function extractServingSizeText(nutritionContainer: any, nutritionData: any) {
  const servingSizeText = nutritionContainer.find('.serving_size.black.serving_size_value').text().trim();
  if (servingSizeText) {
    // Extract the numeric value and unit (e.g., "100 g" -> quantity=100, unit="g")
    const servingMatch = servingSizeText.match(/(\d+(?:[.,]\d+)?)\s*(\D*)/);
    if (servingMatch) {
      const quantity = parseFloat(servingMatch[1].replace(',', '.'));
      const unit = servingMatch[2].trim();

      if (!isNaN(quantity)) {
        nutritionData.servingQuantity = quantity;
        nutritionData.servingUnit = unit || 'g'; // Default to grams if no unit specified
      }
    }
  };
}
