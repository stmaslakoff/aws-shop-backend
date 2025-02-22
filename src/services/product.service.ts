import { products } from '../mocks/data';
import { Product } from '../types/product.types';

export const getProductsList = async (): Promise<Product[]> => {
  return products;
};

export const getProductById = async (productId: string): Promise<Product | undefined> => {
  const products = await getProductsList();
  return products.find(product => product.id === productId);
};
