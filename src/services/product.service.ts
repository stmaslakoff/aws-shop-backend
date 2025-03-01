import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { Product } from '../types/product.types';
import { logger } from '../utils/logger';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const getProductsList = async (): Promise<Product[]> => {
  try {
    const productsResponse = await docClient.send(new ScanCommand({
      TableName: process.env.PRODUCTS_TABLE
    }));

    const products = productsResponse.Items as Product[] || [];

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
