import fetch, { Response } from 'node-fetch';
import { IncomingMessage } from 'http';
import { URL } from 'url';

export const forwardRequest = async (
  serviceUrl: string,
  req: IncomingMessage,
  path: string,
  queryString: string
): Promise<Response> => {
  const url = new URL(path, serviceUrl);
  
  // Add query parameters if they exist
  if (queryString) {
    url.search = queryString;
  }

  const headers: { [key: string]: string } = {};
  Object.entries(req.headers).forEach(([key, value]) => {
    if (value && !['host', 'connection'].includes(key.toLowerCase())) {
      headers[key] = Array.isArray(value) ? value[0] : value;
    }
  });

  let body: any;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = await new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      req.on('data', chunk => chunks.push(chunk));
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    });
  }

  return fetch(url.toString(), {
    method: req.method,
    headers,
    body,
  });
};