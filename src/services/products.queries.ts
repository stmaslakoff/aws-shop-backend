import { docClient } from '../utils/databaseClient';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { Product } from '../types/product.types';

export const getProductsListQuery = async () => {
  const productsResponse = await docClient.send(new ScanCommand({
    TableName: process.env.PRODUCTS_TABLE
  }));

  return productsResponse.Items as Product[] || [];
}
