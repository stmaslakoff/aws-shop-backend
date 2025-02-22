import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getProductsList } from '../services/product.service';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Log the incoming event
  console.log('Event:', JSON.stringify(event));

  try {
    console.info('Processing request...');

    const products = await getProductsList();

    return {
      statusCode: 200,
      body: JSON.stringify(products),
      headers: {
        'Content-Type': 'application/json'
      }
    };
  } catch (error) {
    console.error('Error processing request:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal Server Error'
      })
    };
  }
};
