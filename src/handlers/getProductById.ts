import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getProductById } from '../services/product.service';
import { createResponse } from '../utils/response';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event));

  try {
    const productId = event.pathParameters?.productId;

    if (!productId) {
      return createResponse(400, { message: 'Product ID is required' });
    }

    const product = await getProductById(productId);

    if (!product) {
      return createResponse(404, { message: 'Product not found' });
    }

    return createResponse(200, product);
  } catch (error) {
    console.error('Error processing request:', error);

    return createResponse(500, { message: 'Internal Server Error' });
  }
};
