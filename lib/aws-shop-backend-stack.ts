import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as path from 'path';
import { LayerVersion } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { getCommonHandlerProps } from './utils';

const HANDLERS_FOLDER = '../src/handlers';

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

    const catalogBatchProcess = new NodejsFunction(this, 'CatalogBatchProcess', {
      ...commonHandlerProps,
      entry: path.join(__dirname, `${HANDLERS_FOLDER}/catalogBatchProcess.ts`),
    });

    const catalogItemsQueue = new sqs.Queue(this, 'CatalogItemsQueue', {
      queueName: 'catalogItemsQueue',
    });

    catalogBatchProcess.addEventSource(new lambdaEventSources.SqsEventSource(catalogItemsQueue, {
      batchSize: 5,
    }));

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

    productsTable.grantReadWriteData(catalogBatchProcess);
    stocksTable.grantReadWriteData(catalogBatchProcess);


    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway endpoint URL'
    });
  }
}
