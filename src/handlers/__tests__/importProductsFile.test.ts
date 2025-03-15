import { APIGatewayProxyEvent } from 'aws-lambda';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { handler } from '../importProductsFile';
import { s3Client } from '../../utils/s3Client';

jest.mock('../../utils/s3Client');
jest.mock('@aws-sdk/s3-request-presigner');

describe('importProductsFile handler', () => {
  const mockEvent: Partial<APIGatewayProxyEvent> = {
    queryStringParameters: {
      name: 'test.csv'
    }
  };

  const originalEnv = process.env;

  beforeEach(() => {
    process.env.BUCKET_NAME = 'XXXXXXXXXXX';
    process.env.UPLOADED_FOLDER = 'uploaded';
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return signed URL when file name is provided', async () => {
    const mockSignedUrl = 'https://test-signed-url.com';
    (getSignedUrl as jest.Mock).mockResolvedValue(mockSignedUrl);

    const result = await handler(mockEvent as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual(mockSignedUrl);
    expect(getSignedUrl).toHaveBeenCalledWith(
      s3Client,
      expect.any(PutObjectCommand),
      { expiresIn: expect.any(Number) }
    );
  });

  it('should return 400 when file name is not provided', async () => {
    const eventWithoutFileName: Partial<APIGatewayProxyEvent> = {
      queryStringParameters: {}
    };

    const result = await handler(eventWithoutFileName as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({ message: 'File name is required' });
  });

  it('should handle errors gracefully', async () => {
    const error = new Error('Test error');
    (getSignedUrl as jest.Mock).mockRejectedValue(error);

    const result = await handler(mockEvent as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body)).toEqual({ message: 'Internal Server Error' });
  });
});
