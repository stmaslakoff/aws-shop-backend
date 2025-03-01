import { Stock } from '../types/stock.types';
import { docClient } from '../utils/databaseClient';
import { GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

export const getStocksListQuery = async (): Promise<Stock[]> => {
  const stocksResponse = await docClient.send(new ScanCommand({
    TableName: process.env.STOCKS_TABLE
  }));

  return stocksResponse.Items as Stock[] || [];
}

export const getStockByProductId = async (productId: string): Promise<Stock> => {
  const stockResponse = await docClient.send(new GetCommand({
    TableName: process.env.STOCKS_TABLE,
    Key: { product_id: productId }
  }));

  return stockResponse.Item as Stock;
}
