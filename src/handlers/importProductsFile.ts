import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '../utils/s3Client';
import { createResponse } from '../utils/response';
import { logger } from '../utils/logger';

const BUCKET_NAME = process.env.BUCKET_NAME;
const UPLOADED_FOLDER = process.env.UPLOADED_FOLDER;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const fileName = event.queryStringParameters?.name;

    if (!fileName) {
      logger.warn('File name is required');
      return createResponse(400, { message: 'File name is required' });
    }

    const key = `${UPLOADED_FOLDER}/${fileName}`;
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: 'text/csv',
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    return createResponse(200, signedUrl);
  } catch (error) {
    logger.error('Error getting pre-signed URL', {
      error: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined
    });

    return createResponse(500, {
      message: 'Internal Server Error'
    });
  }
};
