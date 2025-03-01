import { Product } from '../types/product.types';
import { logger } from '../utils/logger';
import { getStockProductsQuery } from './product.queries';

export const getProductsList = async (): Promise<Product[]> => {
  try {
    const products = await getStockProductsQuery();

    logger.info('Retrieved products from database', {
      productsCount: products.length,
    });

    return products;
  } catch (error) {
    logger.error('Error getting products from database', { error });
    throw error;
  }
};

export const getProductById = async (productId: string): Promise<Product | undefined> => {
  const products = await getProductsList();
  return products.find(product => product.id === productId);
};
