import { S3Event } from 'aws-lambda';
import { GetObjectCommand, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Readable, PassThrough } from 'stream';
import { handler } from '../importProductsFileParser';
import { s3Client } from '../../utils/s3Client';
import { logger } from '../../utils/logger';

jest.mock('../../utils/s3Client');
jest.mock('../../utils/logger');

describe('importProductsFileParser handler', () => {
  const mockS3Event: S3Event = {
    Records: [
      {
        s3: {
          bucket: {
            name: 'test-bucket'
          },
          object: {
            key: 'uploaded/test.csv'
          }
        }
      } as any
    ]
  };

  const originalEnv = process.env;

  beforeEach(() => {
    process.env.BUCKET_NAME = 'XXXXXXXXXXX';
    process.env.PARSED_FOLDER = 'parsed';
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.resetAllMocks();
  });

  it('should process CSV file successfully', async () => {
    const mockStream = new PassThrough();
    const mockGetObjectResponse = {
      Body: mockStream,
    };

    (s3Client.send as jest.Mock).mockImplementation((command) => {
      if (command instanceof GetObjectCommand) {
        return Promise.resolve(mockGetObjectResponse);
      }
      return Promise.resolve({});
    });

    const processPromise = handler(mockS3Event);

    mockStream.write('title,description,price\n');
    mockStream.write('Test Product,Test Description,99.99\n');
    mockStream.end();

    await processPromise;

    // For GetObjectCommand
    expect(s3Client.send).toHaveBeenCalledWith(
      expect.any(GetObjectCommand)
    );

// For CopyObjectCommand
    expect(s3Client.send).toHaveBeenCalledWith(
      expect.any(CopyObjectCommand)
    );

// For DeleteObjectCommand
    expect(s3Client.send).toHaveBeenCalledWith(
      expect.any(DeleteObjectCommand)
    );
  });

  it('should handle errors when processing file', async () => {
    const mockError = new Error('Failed to process file');
    (s3Client.send as jest.Mock).mockRejectedValue(mockError);

    await expect(handler(mockS3Event)).rejects.toThrow('Failed to process file');
  });

  it('should handle non-readable response body', async () => {
    const mockGetObjectResponse = {
      Body: 'not a readable stream',
    };

    (s3Client.send as jest.Mock).mockResolvedValue(mockGetObjectResponse);

    await handler(mockS3Event);

    expect(s3Client.send).toHaveBeenCalledTimes(1);
    expect(logger.info).not.toHaveBeenCalledWith(
      expect.stringContaining('File processed and moved')
    );
  });

  it('should handle multiple records in the event', async () => {
    const multiRecordEvent: S3Event = {
      Records: [
        {
          s3: {
            bucket: { name: 'test-bucket' },
            object: { key: 'uploaded/test1.csv' }
          }
        } as any,
        {
          s3: {
            bucket: { name: 'test-bucket' },
            object: { key: 'uploaded/test2.csv' }
          }
        } as any
      ]
    };

    const mockStream = new PassThrough();
    const mockGetObjectResponse = {
      Body: mockStream,
    };

    (s3Client.send as jest.Mock).mockImplementation((command) => {
      if (command instanceof GetObjectCommand) {
        return Promise.resolve(mockGetObjectResponse);
      }
      return Promise.resolve({});
    });

    const processPromise = handler(multiRecordEvent);
    mockStream.end();

    await processPromise;

    expect(s3Client.send).toHaveBeenCalledTimes(6);
  });
});
