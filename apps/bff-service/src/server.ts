import { createServer, IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import { config, validateConfig } from './config';
import { forwardRequest } from './utils/request';

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  try {
    if (!req.url) {
      res.writeHead(400);
      res.end('Bad Request');
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    if (pathParts.length === 0) {
      res.writeHead(400);
      res.end('Service name is required');
      return;
    }

    const serviceName = pathParts[0];
    const serviceUrl = config.services[serviceName];

    if (!serviceUrl) {
      res.writeHead(502);
      res.end('Cannot process request');
      return;
    }

    // Remove the service name from the path
    const targetPath = '/' + pathParts.slice(1).join('/');
    
    try {
      const response = await forwardRequest(
        serviceUrl,
        req,
        targetPath,
        url.search
      );

      // Copy status and headers
      res.writeHead(response.status, Object.fromEntries(response.headers.entries()));

      // Stream the response body
      response.body.pipe(res);
    } catch (error) {
      console.error('Error forwarding request:', error);
      res.writeHead(502);
      res.end('Cannot process request');
    }
  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500);
    res.end('Internal Server Error');
  }
});

try {
  validateConfig();
  server.listen(config.port, () => {
    console.log(`BFF Service is running on port ${config.port}`);
  });
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}