import { APIGatewayAuthorizerResult, APIGatewayTokenAuthorizerEvent } from 'aws-lambda';
import { logger } from '../utils/logger';
import { Effect } from 'aws-cdk-lib/aws-iam';

export const handler = async (event: APIGatewayTokenAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
  try {
    logger.info('Event: ', JSON.stringify(event));

    const token = event.authorizationToken.split(' ')[1];
    const credentials = Buffer.from(token, 'base64').toString('utf-8').split(':');
    const username = credentials[0];
    const password = credentials[1];

    const storedPassword = process.env[username];

    if (storedPassword && storedPassword === password) {
      logger.info('Allow policy for :', { username });
      return generatePolicy(username, Effect.ALLOW, event.methodArn);
    } else {
      logger.info('Deny policy for :', { username });
      return generatePolicy(username, Effect.DENY, event.methodArn, 403);
    }
  } catch (error) {
    logger.error('Error creating auth policy', {
      error,
    });
    return generatePolicy('undefined', Effect.DENY, event.methodArn, 401);
  }
};

const generatePolicy = (
  principalId: string,
  effect: Effect,
  resource: string,
  statusCode?: number
): APIGatewayAuthorizerResult => {
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource,
        },
      ],
    },
    ...(statusCode && { context: { statusCode } }),
  };
};
