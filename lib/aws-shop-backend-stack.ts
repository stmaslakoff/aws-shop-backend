import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';

const HANDLERS_FOLDER = '../src/handlers';

const commonHandlerProps: Partial<NodejsFunctionProps> = {
  runtime: lambda.Runtime.NODEJS_22_X,
  handler: 'handler',
  bundling: {
    minify: true,
    sourceMap: true,
    externalModules: ['aws-sdk'],
  }
}

export class AwsShopBackendStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const getProductsListHandler = new NodejsFunction(this, 'GetProductsListHandler', {
      ...commonHandlerProps,
      entry: path.join(__dirname, `${HANDLERS_FOLDER}/getProductsList.ts`),
    });

    const getProductByIdHandler = new NodejsFunction(this, 'GetProductByIdHandler', {
      ...commonHandlerProps,
      entry: path.join(__dirname, `${HANDLERS_FOLDER}/getProductById.ts`),
    });

    const api = new apigateway.RestApi(this, 'Api', {
      restApiName: 'Products API',
      description: 'API Gateway with Lambda integration'
    });

    const products = api.root.addResource('products');
    products.addMethod('GET', new apigateway.LambdaIntegration(getProductsListHandler));

    const product = products.addResource('{productId}');
    product.addMethod('GET', new apigateway.LambdaIntegration(getProductByIdHandler));

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway endpoint URL'
    });
  }
}
