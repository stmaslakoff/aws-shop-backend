#!/bin/bash

# Check if GITHUB_USERNAME is set
if [ -z "$GITHUB_USERNAME" ]; then
    echo "Error: GITHUB_USERNAME environment variable is not set"
    exit 1
fi

# Check if environment name is provided
if [ -z "$1" ]; then
    echo "Usage: ./deploy.sh <environment_name>"
    exit 1
fi

ENVIRONMENT_NAME=$1

# Initialize Elastic Beanstalk application if it doesn't exist
eb init ${GITHUB_USERNAME}-bff-api --platform "Docker running on 64bit Amazon Linux 2" --region us-east-1

# Create or update the environment
eb create $ENVIRONMENT_NAME \
    --cname ${GITHUB_USERNAME}-bff-api-${ENVIRONMENT_NAME} \
    --single \
    --timeout 10

# Deploy the application
eb deploy $ENVIRONMENT_NAME