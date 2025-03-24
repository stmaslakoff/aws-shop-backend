import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LayerVersion } from 'aws-cdk-lib/aws-lambda';
import 'dotenv/config';
import { getCommonHandlerProps } from './utils';

const HANDLERS_FOLDER = '../src/handlers';

export class AuthorizationStack extends cdk.Stack {
  public readonly authFunction: lambda.Function;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const powertoolsLayer = LayerVersion.fromLayerVersionArn(
      this,
      'PowertoolsLayer',
      `arn:aws:lambda:${cdk.Stack.of(this).region}:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:20`
    );

    const commonHandlerProps = getCommonHandlerProps({
      layers: [powertoolsLayer],
    });

    const username = 'stmaslakoff';
    this.authFunction = new NodejsFunction(this, 'BasicAuthorizerFunction', {
      ...commonHandlerProps,
      entry: path.join(__dirname, `${HANDLERS_FOLDER}/basicAuthorizer.ts`),
      environment: {
        [username]: process.env[username]!,
      },
    });

    this.authFunction.addPermission('APIGatewayInvokePermission', {
      principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      action: 'lambda:InvokeFunction'
    });

    new cdk.CfnOutput(this, 'AuthorizerFunctionArn', {
      value: this.authFunction.functionArn,
      exportName: 'AuthorizerFunctionArn'
    });
  }
}
