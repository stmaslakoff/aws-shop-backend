import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../createProduct';
import * as productService from '../../services/product.service';
import { createMockEvent } from '../../utils/testHelper';
import { ZodError } from 'zod';

jest.mock('../../services/product.service');

describe('createProduct handler', () => {
  let mockEvent: APIGatewayProxyEvent;
  const validProductData = {
    title: 'New Product',
    description: 'This is a new product',
    price: 199,
    count: 10
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockEvent = createMockEvent({
      httpMethod: 'POST',
      path: '/products',
      body: JSON.stringify(validProductData),
    });
  });

  it('should create a product successfully', async () => {
    const createdProduct = {
      id: '123',
      ...validProductData
    };

    (productService.createProduct as jest.Mock).mockResolvedValue(createdProduct);

    const response = await handler(mockEvent);

    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.body)).toEqual(createdProduct);
    expect(productService.createProduct).toHaveBeenCalledWith(validProductData);
  });

  it('should return 400 when body is missing', async () => {
    mockEvent.body = null;

    const response = await handler(mockEvent);

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toEqual({
      message: 'Request body is required'
    });
    expect(productService.createProduct).not.toHaveBeenCalled();
  });

  it('should return 400 when body contains invalid JSON', async () => {
    mockEvent.body = '{invalid json';

    const response = await handler(mockEvent);

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toEqual({
      message: 'Invalid JSON in request body'
    });
    expect(productService.createProduct).not.toHaveBeenCalled();
  });

  it('should handle validation errors', async () => {
    const mockZodError = new ZodError([
      {
        code: 'invalid_type',
        expected: 'number',
        received: 'string',
        path: ['price'],
        message: 'Expected number, received string'
      }
    ]);

    jest.spyOn(jest.requireActual('../../types/product.types').createProductSchema, 'parse')
      .mockImplementationOnce(() => {
        throw mockZodError;
      });

    const response = await handler(mockEvent);

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toHaveProperty('message');
    expect(productService.createProduct).not.toHaveBeenCalled();
  });

  it('should handle internal server errors', async () => {
    (productService.createProduct as jest.Mock).mockRejectedValue(new Error('Database error'));

    const response = await handler(mockEvent);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual({
      message: 'Internal Server Error'
    });
  });
});
