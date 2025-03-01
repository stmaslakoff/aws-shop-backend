import { docClient } from '../utils/databaseClient';
import { GetCommand, ScanCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { StockProduct, Product, CreateProductDto } from '../types/product.types';
import { getStockByProductId, getStocksListQuery } from './stock.queries';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const getProductsListQuery = async (): Promise<Product[]> => {
  const productsResponse = await docClient.send(new ScanCommand({
    TableName: process.env.PRODUCTS_TABLE
  }));

  return productsResponse.Items as Product[] || [];
}

export const getStockProductsQuery = async (): Promise<StockProduct[]> => {
  const products = await getProductsListQuery();

  const stocks = await getStocksListQuery();

  return products.map(product => {
    const stock = stocks.find(stock => stock.product_id === product.id);
    return {
      ...product,
      count: stock ? stock.count : 0
    };
  });
}

export const getStockProductById = async (productId: string): Promise<StockProduct | null> => {
  const productResponse = await docClient.send(new GetCommand({
    TableName: process.env.PRODUCTS_TABLE,
    Key: { id: productId }
  }));

  const product = productResponse.Item as Product;

  if (!product) {
    logger.warn('Product not found', { productId });
    return null;
  }

  const stock = await getStockByProductId(productId);

  return {
    ...product,
    count: stock ? stock.count : 0
  };
}

export const createProductQuery = async (data: CreateProductDto): Promise<StockProduct | null> => {
  const productId = uuidv4();

  const product = {
    id: productId,
    title: data.title,
    description: data.description || '',
    price: data.price,
  };

  const stock = {
    product_id: productId,
    count: data.count || 0
  };

  // Use transaction to ensure both operations succeed or fail together
  const command = new TransactWriteCommand({
    TransactItems: [
      {
        Put: {
          TableName: process.env.PRODUCTS_TABLE!,
          Item: product
        }
      },
      {
        Put: {
          TableName: process.env.STOCKS_TABLE!,
          Item: stock
        }
      }
    ]
  });

  await docClient.send(command);

  return await getStockProductById(productId);
}
