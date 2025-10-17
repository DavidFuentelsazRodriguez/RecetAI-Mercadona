import axios from 'axios';
import { ProductData } from '../models/Product';

const MERCADONA_API_BASE_URL = 'https://tienda.mercadona.es/api';

export interface MercadonaCategoryBase {
  id: number;
  name: string;
  order: number;
  published: boolean;
  is_extended: boolean;
  layout?: number;
}

interface MercadonaCategory extends MercadonaCategoryBase {
  categories?: MercadonaCategoryBase[];
}

interface MercadonaCategoryResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: MercadonaCategory[];
}

export interface MercadonaProduct {
  display_name: string;
  thumbnail: string;
  categories: Array<{
    name: string;
  }>;
  price_instructions: {
    unit_price: string;
    unit_size: number;
    size_format: string;
  };
}

/**
 * Fetches all categories from Mercadona API
 * @returns Promise with array of all categories (including subcategories)
 */
export const fetchCategories = async (): Promise<MercadonaCategoryBase[]> => {
  try {
    const response = await axios.get<MercadonaCategoryResponse>(
      `${MERCADONA_API_BASE_URL}/categories/`,
      {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      }
    );

    // Flatten all categories and subcategories into a single array
    const flattenCategories = (categories: MercadonaCategory[]): MercadonaCategoryBase[] => {
      return categories.reduce<MercadonaCategoryBase[]>((acc, category) => {
        const { categories: subCategories, ...mainCategory } = category;
        acc.push(mainCategory);
        
        if (subCategories && subCategories.length > 0) {
          acc.push(...flattenCategories(subCategories));
        }
        
        return acc;
      }, []);
    };

    return flattenCategories(response.data.results || []);
  } catch (error) {
    console.error('Error fetching categories:', error);
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any;
      console.error('Error details:', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data
      });
    }
    throw new Error('Failed to fetch categories from Mercadona API');
  }
};

/**
 * Fetches products for a specific category
 * @param categoryId - The ID of the category to fetch products for
 * @returns Promise with array of products in the category
 */
export const fetchProductsByCategory = async (categoryId: number): Promise<MercadonaProduct[]> => {
  try {
    const response = await axios.get<{ categories: any}>(
      `${MERCADONA_API_BASE_URL}/categories/${categoryId}/`,
      {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      }
    );

    // Helper function to recursively extract products from categories
    const extractProducts = (categories: any[]): MercadonaProduct[] => {
      return categories.reduce<MercadonaProduct[]>((products, category) => {
        if (category.products && Array.isArray(category.products)) {
          // Add products from this category with their full details
          products.push(...category.products);
        }
        
        // Recursively process subcategories
        if (category.categories && Array.isArray(category.categories)) {
          products.push(...extractProducts(category.categories));
        }
        
        return products;
      }, []);
    };
    
    return extractProducts(response.data.categories || []);
  } catch (error) {
    console.error(`Error fetching products for category ${categoryId}:`, error);
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any;
      console.error('Error details:', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data
      });
    }
    throw new Error(`Failed to fetch products for category ${categoryId}`);
  }
};

/**
 * Fetches all products from all categories
 * @returns Promise with array of all products
 */
export const fetchAllProducts = async (): Promise<MercadonaProduct[]> => {
  try {
    const categories = await fetchCategories();
    const allProducts: MercadonaProduct[] = [];
    
    // Process each category to get its products
    for (const category of categories) {
      try {
        const products = await fetchProductsByCategory(category.id);
        allProducts.push(...products);
      } catch (error) {
        console.error(`Skipping category ${category.name} (${category.id}) due to error:`, error);
        continue;
      }
    }
    
    return allProducts;
  } catch (error) {
    console.error('Error in fetchAllProducts:', error);
    throw new Error('Failed to fetch all products');
  }
};

/**
 * Transforms Mercadona product format to our application's product format
 * @param mercadonaProduct - The product from Mercadona API
 * @returns Product in our application's format with only the required fields
 */
export const transformToProduct = (mercadonaProduct: MercadonaProduct): ProductData => ({
  name: mercadonaProduct.display_name,
  brand: 'Mercadona',
  category: mercadonaProduct.categories?.[0]?.name || 'Otros',
  imageUrl: mercadonaProduct.thumbnail || '',
  price: parseFloat(mercadonaProduct.price_instructions.unit_price) || 0,
  unit: `${mercadonaProduct.price_instructions.unit_size} ${mercadonaProduct.price_instructions.size_format}`,
  nutritionalInfo: {
    calories: 0,  
    protein: 0,   
    carbs: 0,     
    fat: 0,       
  },
  isMercadona: true,
  lastUpdated: new Date(),
});

/**
 * Fetches and transforms all products from Mercadona
 * @returns Promise with array of transformed products
 */
export const getTransformedProducts = async (): Promise<ProductData[]> => {
  const products = await fetchAllProducts();
  return products.map(transformToProduct);
};