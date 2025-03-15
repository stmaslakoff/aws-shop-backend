import { SQSEvent } from 'aws-lambda';
import { createProduct } from '../services/product.service';
import { logger } from '../utils/logger';
import { sns } from '../utils/snsClient';

export const handler = async (event: SQSEvent): Promise<void> => {
  try {
    logger.info('catalogBatchProcess lambda triggered with event:', JSON.stringify(event));

    const products = event.Records.map(record => JSON.parse(record.body));

    logger.info('Parsed products data', { tableName: process.env.PRODUCTS_TABLE, products });

    const createdProducts = [];

    for (const product of products) {
      const createdProduct = await createProduct(product);
      if (createdProduct) {
        createdProducts.push(createdProduct);
      }
      logger.info(`Successfully created product: ${JSON.stringify(product)}`);
    }

    await sns.publish({
      TopicArn: process.env.SNS_TOPIC_ARN,
      Subject: 'New Products Created',
      Message: JSON.stringify({
        message: 'Products were created successfully',
        createdProducts,
      }),
      MessageAttributes: {
        createdProductsLength: {
          DataType: 'Number',
          StringValue: createdProducts.length.toString(),
        },
        status: {
          DataType: 'String',
          StringValue: 'success'
        }
      },
    });


  } catch (error) {
    logger.error('Error processing batch:', { error });
    throw error;
  }
};
