import { StockProduct, CreateProductDto } from '../types/product.types';
import { logger } from '../utils/logger';
import { createProductQuery, getStockProductById, getStockProductsQuery } from './product.queries';

export const getProductsList = async (): Promise<StockProduct[]> => {
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

export const getProductById = async (productId: string): Promise<StockProduct | null> => {
  try {
    return await getStockProductById(productId);
  } catch (error) {
    logger.error('Error getting a product from database', { productId, error });
    throw error;
  }
};

export const createProduct = async (data: CreateProductDto) => {
  try {
    const product = await createProductQuery(data);

    logger.info('Created new product and stock', {
      product,
    });

    return product;
  } catch (error) {
    logger.error('Error creating product in database', { error });
    throw error;
  }
}
