import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';

const HANDLERS_FOLDER = '../dist/src/handlers';

export class AwsShopBackendStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const handler = new lambda.Function(this, 'ApiHandler', {
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambda.Code.fromAsset(path.join(__dirname, HANDLERS_FOLDER)),
      handler: 'getProductsList.handler',
    });

    const api = new apigateway.RestApi(this, 'Api', {
      restApiName: 'Products API',
      description: 'API Gateway with Lambda integration'
    });

    const integration = new apigateway.LambdaIntegration(handler);
    api.root.addMethod('GET', integration);
  }
}
