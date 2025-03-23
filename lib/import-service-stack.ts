import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { AuthorizationStack } from './authorization-stack';
import * as path from 'path';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { LayerVersion } from 'aws-cdk-lib/aws-lambda';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { getCommonHandlerProps } from './utils';

const HANDLERS_FOLDER = '../src/handlers';

interface ImportServiceStackProps extends cdk.StackProps {
  authStack: AuthorizationStack;
}

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const importBucket = new s3.Bucket(this, 'ImportBucket', {
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
          ],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only
    });

    const powertoolsLayer = LayerVersion.fromLayerVersionArn(
      this,
      'PowertoolsLayer',
      `arn:aws:lambda:${cdk.Stack.of(this).region}:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:20`
    );

    const commonEnvironment = {
      BUCKET_NAME: importBucket.bucketName,
      UPLOADED_FOLDER: 'uploaded',
      PARSED_FOLDER: 'parsed',
    };

    const commonHandlerProps = getCommonHandlerProps({
      layers: [powertoolsLayer],
      environment: commonEnvironment,
    });

    const importProductsFile = new NodejsFunction(this, 'ImportProductsFileLambda', {
      ...commonHandlerProps,
      entry: path.join(__dirname, `${HANDLERS_FOLDER}/importProductsFile.ts`),
    });

    const catalogItemsQueue = Queue.fromQueueArn(
      this,
      'CatalogItemsQueue',
      'arn:aws:sqs:eu-central-1:390402543142:catalogItemsQueue' // TODO replace hardcoded ARN with a more elegant solution
    );

    const importProductsFileParser = new NodejsFunction(this, 'ImportProductsFileParserLambda', {
      ...commonHandlerProps,
      environment: {
        ...commonHandlerProps.environment,
        SQS_QUEUE_URL: catalogItemsQueue.queueUrl,
      },
      entry: path.join(__dirname, `${HANDLERS_FOLDER}/importProductsFileParser.ts`),
      timeout: cdk.Duration.seconds(60),
    });

    catalogItemsQueue.grantSendMessages(importProductsFileParser);

    importBucket.grantReadWrite(importProductsFile);
    importBucket.grantReadWrite(importProductsFileParser);
    importBucket.grantDelete(importProductsFileParser);

    importBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(importProductsFileParser),
      {prefix: `${commonEnvironment.UPLOADED_FOLDER}/`}
    );

    const authorizerFunction = NodejsFunction.fromFunctionArn(
      this,
      'ImportedAuthorizerFunction',
      cdk.Fn.importValue('AuthorizerFunctionArn')
    );

    const authorizer = new apigateway.TokenAuthorizer(this, 'ImportAuthorizer', {
      handler: authorizerFunction,
      identitySource: apigateway.IdentitySource.header('Authorization')
    });

    const api = new apigateway.RestApi(this, 'ImportApi', {
      restApiName: 'Import Service',
    });

    const importResource = api.root.addResource('import');
    importResource.addMethod('GET',
      new apigateway.LambdaIntegration(importProductsFile), {
        requestParameters: {
          'method.request.querystring.name': true,
        },
        authorizer: authorizer,
        authorizationType: apigateway.AuthorizationType.CUSTOM
      }
    );
  }
}
