import { Request, Response, NextFunction } from 'express';
import { Logger } from '../../config/logger';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'HttpError';
  }
}

export function errorMiddleware(error: Error, req: Request, res: Response, next: NextFunction): void {
  let status = 500;
  let message = 'Internal Server Error';
  
  // Handle known error types
  if (error instanceof HttpError) {
    status = error.status;
    message = error.message;
  } else if (error.name === 'ValidationError') {
    status = 400;
    message = error.message;
  } else if (error.name === 'UnauthorizedError') {
    status = 401;
    message = 'Unauthorized';
  } else if (error.name === 'ForbiddenError') {
    status = 403;
    message = 'Forbidden';
  } else if (error.name === 'NotFoundError') {
    status = 404;
    message = 'Not Found';
  }
  
  // Log error with appropriate level
  if (status >= 500) {
    Logger.error(`[${req.method}] ${req.path} >> StatusCode: ${status}, Message: ${message}`, {
      error: error.stack,
      body: req.body,
      params: req.params,
      query: req.query
    });
  } else {
    Logger.warn(`[${req.method}] ${req.path} >> StatusCode: ${status}, Message: ${message}`, {
      body: req.body,
      params: req.params,
      query: req.query
    });
  }
  
  // Send error response
  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
}
