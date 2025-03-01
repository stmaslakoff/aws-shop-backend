import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../getProductById';
import * as productService from '../../services/product.service';
import { createMockEvent } from '../../utils/testHelper';

jest.mock('../../services/product.service');

describe('getProductById handler', () => {
  let mockEvent: APIGatewayProxyEvent;

  beforeEach(() => {
    jest.clearAllMocks();

    mockEvent = createMockEvent({
      path: '/products/1',
      pathParameters: { productId: '1' },
    });
  });

  it('should return product when found', async () => {
    const mockProduct = { id: '1', name: 'Product 1', price: 100 };

    (productService.getProductById as jest.Mock).mockReturnValue(mockProduct);

    const response = await handler(mockEvent);

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual(mockProduct);
    expect(productService.getProductById).toHaveBeenCalledWith('1');
  });

  it('should return 404 when product not found', async () => {
    (productService.getProductById as jest.Mock).mockReturnValue(null);

    const response = await handler(mockEvent);

    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body)).toEqual({
      message: 'Product not found'
    });
  });

  it('should return 400 when productId is missing', async () => {
    mockEvent.pathParameters = null;

    const response = await handler(mockEvent);

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toEqual({
      message: 'Product ID is required'
    });
  });

  it('should handle service errors', async () => {
    (productService.getProductById as jest.Mock).mockImplementation(() => {
      throw new Error('Service error');
    });

    const response = await handler(mockEvent);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual({
      message: 'Internal Server Error'
    });
  });
});
