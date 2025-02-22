import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getProductsList } from '../services/product.service';
import { createResponse } from '../utils/response';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event));

  try {
    console.info('Processing request...');

    const products = await getProductsList();

    return createResponse(200, products)
  } catch (error) {
    console.error('Error processing request:', error);

    return createResponse(500, {
      message: 'Internal Server Error'
    });
  }
};
