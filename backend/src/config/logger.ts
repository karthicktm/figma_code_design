import winston from 'winston';
import { env } from './env';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create console transport
const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return `${timestamp} [${level}]: ${message} ${
        Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
      }`;
    })
  )
});

// Create logger instance
export const Logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: logFormat,
  transports: [consoleTransport]
});

// Add file transports in production
if (env.NODE_ENV === 'production') {
  Logger.add(
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  );
  
  Logger.add(
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  );
}

// Export logger functions for convenience
export const logDebug = Logger.debug.bind(Logger);
export const logInfo = Logger.info.bind(Logger);
export const logWarn = Logger.warn.bind(Logger);
export const logError = Logger.error.bind(Logger);
