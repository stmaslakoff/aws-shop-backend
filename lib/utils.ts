import { ILayerVersion } from 'aws-cdk-lib/aws-lambda/lib/layers';
import { NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export const getCommonHandlerProps = ({ layers, environment }: { layers?: [ILayerVersion], environment?: { [key: string]: string } }): Partial<NodejsFunctionProps> => ({
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
    ],
  }
});
