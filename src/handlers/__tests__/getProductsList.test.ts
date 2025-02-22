import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../getProductsList';
import * as productService from '../../services/product.service';
import { createMockEvent } from '../../utils/testHelper';

jest.mock('../../services/product.service');

describe('getProductsList handler', () => {
  let mockEvent: APIGatewayProxyEvent;

  beforeEach(() => {
    jest.clearAllMocks();

    mockEvent = createMockEvent();
  });

  it('should return products list successfully', async () => {
    const mockProducts = [
      { id: '1', name: 'Product 1', price: 100 },
      { id: '2', name: 'Product 2', price: 200 }
    ];

    (productService.getProductsList as jest.Mock).mockReturnValue(mockProducts);

    const response = await handler(mockEvent);

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual(mockProducts);
    expect(response.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
    expect(productService.getProductsList).toHaveBeenCalledTimes(1);
  });

  it('should handle service errors', async () => {
    (productService.getProductsList as jest.Mock).mockImplementation(() => {
      throw new Error('Service error');
    });

    const response = await handler(mockEvent);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual({
      message: 'Internal Server Error'
    });
  });
});
