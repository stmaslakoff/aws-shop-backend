import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getProductById } from '../services/product.service';
import { createResponse } from '../utils/response';
import { logger } from '../utils/logger';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const productId = event.pathParameters?.productId;

    logger.info('Processing get product by id request', {
      productId,
      httpMethod: event.httpMethod,
      path: event.path
    });

    if (!productId) {
      logger.warn('Missing product ID in request');
      return createResponse(400, { message: 'Product ID is required' });
    }

    const product = await getProductById(productId);

    if (!product) {
      logger.warn('Product not found', { productId });
      return createResponse(404, { message: 'Product not found' });
    }

    logger.info('Successfully retrieved product', {
      product,
    });

    return createResponse(200, product);
  } catch (error) {
    logger.error('Error retrieving product', {
      error: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      productId: event.pathParameters?.productId
    });

    return createResponse(500, { message: 'Internal Server Error' });
  }
};
