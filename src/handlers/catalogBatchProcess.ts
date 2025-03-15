import { SQSEvent } from 'aws-lambda';
import { createProduct } from '../services/product.service';
import { logger } from '../utils/logger';

export const handler = async (event: SQSEvent): Promise<void> => {
  try {
    logger.info('catalogBatchProcess lambda triggered with event:', JSON.stringify(event));

    const products = event.Records.map(record => JSON.parse(record.body));

    logger.info('Parsed products data', { tableName: process.env.PRODUCTS_TABLE, products });

    for (const product of products) {
      await createProduct(product);
      logger.info(`Successfully created product: ${JSON.stringify(product)}`);
    }
  } catch (error) {
    logger.error('Error processing batch:', { error });
    throw error;
  }
};
