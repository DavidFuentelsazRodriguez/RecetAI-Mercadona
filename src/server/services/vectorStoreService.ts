import { QdrantClient } from '@qdrant/js-client-rest';
import { ProductData } from '../models/Product';
import { gemini } from '../config/gemini';
import logger from '../config/logger';
import crypto from 'crypto';

const QDRANT_HOST = process.env.QDRANT_HOST || 'qdrant';
const QDRANT_PORT = Number(process.env.QDRANT_PORT || 6333);
const client = new QdrantClient({ host: QDRANT_HOST, port: QDRANT_PORT });

const COLLECTION_NAME = 'products';
const EMBEDDING_MODEL = 'text-embedding-004';

interface PointData {
  id: string;
  vector: number[];
  payload: {
    name: string;
    brand?: string;
    mongoId: string;
  };
}

interface ProductScore {
  id: string;
  name: string;
  brand?: string;
  score: number;
}

/**
 * Generates an embedding for a given text using the text-embedding-004 model from Gem.
 * @param text The text to generate an embedding for.
 * @returns A promise that resolves to the embedding values as an array of numbers.
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const model = gemini.genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    logger.error(error as string, 'Error generating embedding');
    throw error;
  }
}

/**
 * Initializes the vector store by creating a collection if it doesn't exist.
 */
export const initVectorStore = async () => {
  try {
    const response = await client.getCollections();
    const exists = response.collections.find(c => c.name === COLLECTION_NAME);

    if (!exists) {
      await client.createCollection(COLLECTION_NAME, {
        vectors: { size: 768, distance: 'Cosine' },
      });
      logger.info(`Vectorial collection '${COLLECTION_NAME}' created.`);
    }
  } catch (error) {
    logger.error(error as string, 'Error connecting to Qdrant');
  }
};

/**
 * Indexes products in Qdrant for semantic search
 * @param products The array of products to index
 */
export const indexProducts = async (products: (ProductData & { _id: unknown })[]) => {
  if (products.length === 0) return;

  logger.info(`Generating embeddings for ${products.length} products...`);

  const points: PointData[] = [];

  for (const product of products) {
    const textToEmbed = `${product.name} ${product.brand || ''}`.trim();

    try {
      const vector = await generateEmbedding(textToEmbed);
      const safeId = generateId(product._id);

      points.push({
        id: safeId,
        vector: vector,
        payload: {
          name: product.name,
          brand: product.brand,
          mongoId: String(product._id),
        },
      });
    } catch (err) {
      logger.warn(`Skipping product ${product.name} due to embedding error: ${err}`);
    }
  }

  if (points.length > 0) {
    await client.upsert(COLLECTION_NAME, {
      points: points,
    });

    logger.info(`Indexed ${points.length} products in Qdrant.`);
  }
};

/**
 * Searches products by theme in the vector store.
 * @param theme The theme to search for
 * @param limit The number of results to return
 * @returns A promise that resolves to an array of product scores
 */
export const searchProductsByTheme: (
  theme: string,
  limit: number
) => Promise<ProductScore[]> = async (theme: string, limit: number = 10) => {
  const vector = await generateEmbedding(theme);

  const searchResult = await client.search(COLLECTION_NAME, {
    vector: vector,
    limit: limit,
    with_payload: true,
    score_threshold: 0.7,
  });

  return searchResult.map(res => ({
    id: res.payload?.mongoId as string,
    name: res.payload?.name as string,
    brand: res.payload?.brand as string,
    score: res.score,
  }));
};

/**
 * Generates a unique identifier from a MongoDB ID string using MD5 hashing.
 * The resulting identifier is a 32-character hexadecimal string, formatted as
 * 8-4-4-4-12. This is the format required by Qdrant.
 * @param mongoId The MongoDB ID string to generate an identifier from
 * @returns The generated identifier string
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateId(mongoId: any): string {
  const idString = String(mongoId);
  const hash = crypto.createHash('md5').update(idString).digest('hex');

  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    hash.substring(12, 16),
    hash.substring(16, 20),
    hash.substring(20, 32),
  ].join('-');
}
