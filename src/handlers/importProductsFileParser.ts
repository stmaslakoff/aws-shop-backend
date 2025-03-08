import { S3Event } from 'aws-lambda';
import { GetObjectCommand, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import csvParser from 'csv-parser';
import { logger } from '../utils/logger';
import { s3Client } from '../utils/s3Client';

const BUCKET_NAME = process.env.BUCKET_NAME;
const PARSED_FOLDER = process.env.PARSED_FOLDER;

export const handler = async (event: S3Event) => {
  try {
    for (const record of event.Records) {
      const key = decodeURIComponent(record.s3.object.key);
      logger.info(`Processing file: ${key}`);

      const getObjectResponse = await s3Client.send(
        new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
        })
      );

      if (getObjectResponse.Body instanceof Readable) {

        await new Promise((resolve, reject) => {
          const stream = getObjectResponse.Body as Readable;

          stream
            .pipe(csvParser())
            .on('data', (data) => {
              logger.info('Parsed CSV row:', JSON.stringify(data));
            })
            .on('error', (error) => {
              logger.error('Error parsing CSV:', error);
              reject(error);
            })
            .on('end', async () => {
              try {
                const newKey = key.replace('uploaded/', `${PARSED_FOLDER}/`);
                await s3Client.send(
                  new CopyObjectCommand({
                    Bucket: BUCKET_NAME,
                    CopySource: `${BUCKET_NAME}/${key}`,
                    Key: newKey,
                  })
                );

                await s3Client.send(
                  new DeleteObjectCommand({
                    Bucket: BUCKET_NAME,
                    Key: key,
                  })
                );

                logger.info(`File processed and moved to ${newKey}`);
                resolve(true);
              } catch (error) {
                reject(error);
              }
            });
        });
      }
    }
  } catch (error) {
    logger.error('Error processing file', { error });
    throw error;
  }
};
