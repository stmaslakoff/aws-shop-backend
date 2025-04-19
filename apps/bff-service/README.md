# BFF Service

This service acts as a Backend-for-Frontend (BFF) layer that routes requests to appropriate backend services.

## Features

- Routes requests to Product and Cart services
- Handles all HTTP methods
- Forwards query parameters and request bodies
- Returns appropriate error messages and status codes

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update the environment variables in `.env` with your service URLs.

## Development

Start the development server:
```bash
npm run dev
```

## Testing

Run the tests:
```bash
npm test
```

## Deployment

1. Set your GitHub username as an environment variable:
```bash
export GITHUB_USERNAME=your-github-username
```

2. Make the deployment script executable:
```bash
chmod +x scripts/deploy.sh
```

3. Deploy to Elastic Beanstalk:
```bash
./scripts/deploy.sh production
```

## API Usage

Make requests to the BFF service using the following format:
```
{bff-service-url}/{recipient-service-name}?var1=someValue
```

Example:
```
http://localhost:3000/product/items?id=123
http://localhost:3000/cart/items
```

## Error Handling

- 502 Bad Gateway: Returned when the recipient service is not configured or cannot be reached
- Original status codes: All other status codes are forwarded from the recipient services