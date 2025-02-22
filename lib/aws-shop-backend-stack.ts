import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

const HANDLERS_FOLDER = '../src/handlers';

export class AwsShopBackendStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const handler = new NodejsFunction(this, 'ApiHandler', {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, `${HANDLERS_FOLDER}/getProductsList.ts`),
      handler: 'handler',
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['aws-sdk'],
      }
    });

    const api = new apigateway.RestApi(this, 'Api', {
      restApiName: 'Products API',
      description: 'API Gateway with Lambda integration'
    });

    const products = api.root.addResource('products');
    products.addMethod('GET', new apigateway.LambdaIntegration(handler));

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway endpoint URL'
    });
  }
}
