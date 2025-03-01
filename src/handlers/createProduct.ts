import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createProduct } from '../services/product.service';
import { createResponse } from '../utils/response';
import { logger } from '../utils/logger';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Processing create product request', {
      httpMethod: event.httpMethod,
      path: event.path,
      body: event.body
    });

    if (!event.body) {
      return createResponse(400, {
        message: 'Request body is required'
      });
    }

    const productData = JSON.parse(event.body);

    logger.info('Parsed JSON data', {
      productData,
    });

    if (!productData.title || typeof productData.price !== 'number') {
      return createResponse(400, {
        message: 'Title and price are required fields. Price must be a number.'
      });
    }

    const newProduct = await createProduct(productData);

    logger.info('Successfully created product', {
      product: newProduct,
    });

    return createResponse(201, newProduct);
  } catch (error) {
    logger.error('Error creating product', {
      error: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined
    });

    if (error instanceof SyntaxError) {
      return createResponse(400, {
        message: 'Invalid JSON in request body'
      });
    }

    return createResponse(500, {
      message: 'Internal Server Error'
    });
  }
};
