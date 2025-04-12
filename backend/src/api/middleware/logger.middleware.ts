import { Request, Response, NextFunction } from 'express';
import { Logger } from '../../config/logger';

export function loggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  
  // Log request
  Logger.info(`[${req.method}] ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    query: req.query,
    params: req.params
  });
  
  // Log large request bodies at debug level only
  if (req.body && Object.keys(req.body).length > 0) {
    if (req.path.includes('/figma/import') || req.path.includes('/figma/analyze')) {
      // For large Figma data, just log that data was received
      Logger.debug(`Request body for ${req.path}: [Large Figma data]`);
    } else {
      Logger.debug(`Request body for ${req.path}:`, req.body);
    }
  }
  
  // Capture response
  const originalSend = res.send;
  res.send = function(body): Response {
    const responseTime = Date.now() - startTime;
    
    // Log response (but don't log large response bodies)
    const shouldLogResponseBody = 
      res.statusCode !== 200 || // Always log non-200 responses
      !(
        req.path.includes('/figma/') || 
        req.path.includes('/generation/') || 
        req.path.includes('/validation/')
      ); // Skip logging large responses
    
    Logger.info(`[${req.method}] ${req.path} >> StatusCode: ${res.statusCode}, Time: ${responseTime}ms`);
    
    if (shouldLogResponseBody && process.env.NODE_ENV === 'development') {
      try {
        const bodyObj = JSON.parse(body);
        Logger.debug(`Response body for ${req.path}:`, bodyObj);
      } catch (e) {
        // Non-JSON response, just log a snippet
        const bodyPreview = typeof body === 'string' 
          ? body.substring(0, 100) + (body.length > 100 ? '...' : '') 
          : '[Non-string response]';
        Logger.debug(`Response body preview for ${req.path}: ${bodyPreview}`);
      }
    }
    
    return originalSend.call(this, body);
  };
  
  next();
}
