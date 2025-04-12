import { Request, Response, NextFunction } from 'express';
import { HttpError } from './error.middleware';
import { Logger } from '../../config/logger';

// Very simple authentication middleware
// In a real app, you would implement proper authentication with JWT, OAuth, etc.
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // For now, we'll just check for an API key in the header
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    throw new HttpError(401, 'API key is required');
  }
  
  // In a real app, you would validate the API key against a database
  // For this example, we'll just check if it's not empty
  if (apiKey === 'test-api-key' || process.env.NODE_ENV === 'development') {
    next();
    return;
  }
  
  Logger.warn('Invalid API key', { apiKey });
  throw new HttpError(401, 'Invalid API key');
}
