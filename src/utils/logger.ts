import { Logger } from '@aws-lambda-powertools/logger';

const logLevel = process.env.NODE_ENV === 'test' ? 'SILENT' : 'INFO';

export const logger = new Logger({
  serviceName: 'product-service',
  logLevel,
});
