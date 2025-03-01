import { APIGatewayProxyEvent } from 'aws-lambda';

export const createMockEvent = (overrides?: Partial<APIGatewayProxyEvent>): APIGatewayProxyEvent => ({
  httpMethod: 'GET',
  path: '/products',
  headers: {},
  multiValueHeaders: {},
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  pathParameters: null,
  stageVariables: null,
  requestContext: {} as any,
  resource: '',
  isBase64Encoded: false,
  body: null,
  ...overrides
});
