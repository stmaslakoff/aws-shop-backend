import { docClient } from '../utils/databaseClient';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { JoinedProduct, Product } from '../types/product.types';
import { Stock } from '../types/stock.types';

const getProductsListQuery = async (): Promise<Product[]> => {
  const productsResponse = await docClient.send(new ScanCommand({
    TableName: process.env.PRODUCTS_TABLE
  }));

  return productsResponse.Items as Product[] || [];
}

export const getStocksListQuery = async (): Promise<Stock[]> => {
  const stocksResponse = await docClient.send(new ScanCommand({
    TableName: process.env.STOCKS_TABLE
  }));

  return stocksResponse.Items as Stock[] || [];
}

export const getStockProductsQuery = async (): Promise<JoinedProduct[]> => {
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
