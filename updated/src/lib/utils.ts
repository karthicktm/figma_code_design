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

// Other utility functions...