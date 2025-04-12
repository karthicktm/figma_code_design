import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

interface EnvironmentVariables {
  // Server configuration
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  
  // API configuration
  API_PREFIX: string;
  CORS_ORIGIN: string;
  
  // Logging configuration
  LOG_LEVEL: string;
  
  // OpenAI configuration
  OPENAI_API_KEY: string;
  OPENAI_MODEL: string;
  
  // Figma API configuration
  FIGMA_API_URL: string;
}

export const env: EnvironmentVariables = {
  // Server configuration
  PORT: parseInt(process.env.PORT || '3001', 10),
  NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  
  // API configuration
  API_PREFIX: process.env.API_PREFIX || '/api',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  
  // Logging configuration
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // OpenAI configuration
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4',
  
  // Figma API configuration
  FIGMA_API_URL: process.env.FIGMA_API_URL || 'https://api.figma.com/v1'
};

