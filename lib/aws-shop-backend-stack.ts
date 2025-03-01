import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as path from 'path';
import { LayerVersion, Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { ILayerVersion } from 'aws-cdk-lib/aws-lambda/lib/layers';

const HANDLERS_FOLDER = '../src/handlers';

const getCommonHandlerProps = ({ layers, environment }: { layers?: [ILayerVersion], environment?: { [key: string]: string } }): Partial<NodejsFunctionProps> => ({
  runtime: lambda.Runtime.NODEJS_22_X,
  environment,
  handler: 'handler',
  layers,
  tracing: lambda.Tracing.ACTIVE,
  bundling: {
    minify: true,
    sourceMap: true,
    externalModules: [
      '@aws-lambda-powertools/*',
      'aws-sdk'
    ],
  }
});

export class AwsShopBackendStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const productsTable = dynamodb.Table.fromTableName(
      this,
      'ProductsTable',
      'products',
    );

    const stocksTable = dynamodb.Table.fromTableName(
      this,
      'StocksTable',
      'stocks',
    );

    const powertoolsLayer = LayerVersion.fromLayerVersionArn(
      this,
      'PowertoolsLayer',
      `arn:aws:lambda:${cdk.Stack.of(this).region}:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:20`
    );

    const commonEnvironment = {
      PRODUCTS_TABLE: productsTable.tableName,
      STOCKS_TABLE: stocksTable.tableName,
    };

    const commonHandlerProps = getCommonHandlerProps({
      layers: [powertoolsLayer],
      environment: commonEnvironment,
    });

    const getProductsListHandler = new NodejsFunction(this, 'GetProductsListHandler', {
      ...commonHandlerProps,
      entry: path.join(__dirname, `${HANDLERS_FOLDER}/getProductsList.ts`),
    });

    const getProductByIdHandler = new NodejsFunction(this, 'GetProductByIdHandler', {
      ...commonHandlerProps,
      entry: path.join(__dirname, `${HANDLERS_FOLDER}/getProductById.ts`),
    });

    const createProductHandler = new NodejsFunction(this, 'CreateProductHandler', {
      ...commonHandlerProps,
      entry: path.join(__dirname, `${HANDLERS_FOLDER}/createProduct.ts`),
    });

    const api = new apigateway.RestApi(this, 'Api', {
      restApiName: 'Products API',
      description: 'API Gateway with Lambda integration',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS
      },
    });

    const products = api.root.addResource('products');
    products.addMethod('GET', new apigateway.LambdaIntegration(getProductsListHandler));
    products.addMethod('POST', new apigateway.LambdaIntegration(createProductHandler));

    const product = products.addResource('{productId}');
    product.addMethod('GET', new apigateway.LambdaIntegration(getProductByIdHandler));

    productsTable.grantReadData(getProductsListHandler);
    stocksTable.grantReadData(getProductsListHandler);
    productsTable.grantReadData(getProductByIdHandler);
    stocksTable.grantReadData(getProductByIdHandler);

    productsTable.grantReadWriteData(createProductHandler);
    stocksTable.grantReadWriteData(createProductHandler);

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway endpoint URL'
    });
  }
}
