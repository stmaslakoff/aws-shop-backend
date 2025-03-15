import { SQSEvent } from 'aws-lambda';
import { handler } from '../catalogBatchProcess';
import { createProduct } from '../../services/product.service';
import { sns } from '../../utils/snsClient';
import { logger } from '../../utils/logger';

jest.mock('../../services/product.service');
jest.mock('../../utils/snsClient');
jest.mock('../../utils/logger');

describe('catalogBatchProcess', () => {
  const mockProduct = {
    title: 'Test Product',
    description: 'Test Description',
    price: 100,
    count: 10
  };

  const mockSQSEvent: SQSEvent = {
    Records: [
      {
        body: JSON.stringify(mockProduct),
        messageId: '1',
        receiptHandle: '',
        attributes: {
          ApproximateReceiveCount: '',
          SentTimestamp: '',
          SenderId: '',
          ApproximateFirstReceiveTimestamp: ''
        },
        messageAttributes: {},
        md5OfBody: '',
        eventSource: '',
        eventSourceARN: '',
        awsRegion: ''
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SNS_TOPIC_ARN = 'mock-topic-arn';
    process.env.PRODUCTS_TABLE = 'mock-table';
  });

  it('should process SQS event and create products', async () => {
    const createdProduct = { ...mockProduct, id: '123' };
    (createProduct as jest.Mock).mockResolvedValue(createdProduct);
    (sns.publish as jest.Mock).mockResolvedValue({});

    await handler(mockSQSEvent);

    expect(createProduct).toHaveBeenCalledWith(mockProduct);
    expect(sns.publish).toHaveBeenCalledWith({
      TopicArn: 'mock-topic-arn',
      Subject: 'New Products Created',
      Message: JSON.stringify({
        message: 'Products were created successfully',
        createdProducts: [createdProduct],
      }),
      MessageAttributes: {
        createdProductsLength: {
          DataType: 'Number',
          StringValue: '1',
        },
        status: {
          DataType: 'String',
          StringValue: 'success'
        }
      },
    });
    expect(logger.info).toHaveBeenCalled();
  });

  it('should handle errors properly', async () => {
    const error = new Error('Test error');
    (createProduct as jest.Mock).mockRejectedValue(error);

    await expect(handler(mockSQSEvent)).rejects.toThrow('Test error');
    expect(logger.error).toHaveBeenCalledWith('Error processing batch:', { error });
    expect(sns.publish).not.toHaveBeenCalled();
  });

  it('should process multiple products in batch', async () => {
    const mockProducts = [
      mockProduct,
      { ...mockProduct, title: 'Test Product 2' }
    ];
    const mockMultiSQSEvent: SQSEvent = {
      Records: mockProducts.map(product => ({
        body: JSON.stringify(product),
        messageId: '1',
        receiptHandle: '',
        attributes: {
          ApproximateReceiveCount: '',
          SentTimestamp: '',
          SenderId: '',
          ApproximateFirstReceiveTimestamp: ''
        },
        messageAttributes: {},
        md5OfBody: '',
        eventSource: '',
        eventSourceARN: '',
        awsRegion: ''
      }))
    };

    const createdProducts = mockProducts.map((p, i) => ({ ...p, id: `123${i}` }));
    (createProduct as jest.Mock).mockImplementation((product) => {
      const index = mockProducts.findIndex(p => p.title === product.title);
      return Promise.resolve(createdProducts[index]);
    });
    (sns.publish as jest.Mock).mockResolvedValue({});

    await handler(mockMultiSQSEvent);

    expect(createProduct).toHaveBeenCalledTimes(2);
    mockProducts.forEach(product => {
      expect(createProduct).toHaveBeenCalledWith(product);
    });
    
    expect(sns.publish).toHaveBeenCalledWith({
      TopicArn: 'mock-topic-arn',
      Subject: 'New Products Created',
      Message: JSON.stringify({
        message: 'Products were created successfully',
        createdProducts,
      }),
      MessageAttributes: {
        createdProductsLength: {
          DataType: 'Number',
          StringValue: '2',
        },
        status: {
          DataType: 'String',
          StringValue: 'success'
        }
      },
    });
  });
});