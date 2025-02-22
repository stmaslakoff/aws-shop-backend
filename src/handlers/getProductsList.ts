import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getProductsList } from '../services/product.service';
import { createResponse } from '../utils/response';
import { logger } from '../utils/logger';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Processing get products list request', {
      httpMethod: event.httpMethod,
      path: event.path
    });

    const products = await getProductsList();

    logger.info('Successfully retrieved products', {
      products,
    });

    return createResponse(200, products)
  } catch (error) {
    logger.error('Error retrieving products', {
      error: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined
    });

    return createResponse(500, {
      message: 'Internal Server Error'
    });
  }
};
