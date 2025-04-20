import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extracts the file ID from a Figma URL or returns the ID if it's already an ID
 */
export function extractFigmaFileId(fileIdOrUrl: string): string {
  if (!fileIdOrUrl) return '';
  
  // Check if it's already a file ID
  if (!fileIdOrUrl.includes('/')) {
    return fileIdOrUrl;
  }
  
  // Extract from URL
  try {
    const url = new URL(fileIdOrUrl);
    const path = url.pathname;
    
    // Format: https://www.figma.com/file/abcdef123456/My-Design or
    // https://www.figma.com/design/abcdef123456/My-Design
    const matches = path.match(/\/(file|design)\/([a-zA-Z0-9]+)\//) 
    
    if (matches && matches[2]) {
      return matches[2];
    }
    
    return '';
  } catch (e) {
    // Not a valid URL, try to extract the ID directly
    const matches = fileIdOrUrl.match(/\/(?:file|design)\/([a-zA-Z0-9]+)\//)
    return matches && matches[1] ? matches[1] : fileIdOrUrl;
  }
}

/**
 * Convert a camelCase string to Title Case
 */
export function camelToTitleCase(str: string): string {
  if (!str) return '';
  
  // Add space before capital letters and uppercase the first character
  const result = str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase());
  
  // Remove trailing "Component" if present
  return result.replace(' Component', '');
}

/**
 * Truncate a string to a certain length and add ellipsis
 */
export function truncate(str: string, length: number): string {
  if (!str) return '';
  
  if (str.length <= length) return str;
  
  return str.substring(0, length) + '...';
}

/**
 * Format a date string to a more readable format
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
}