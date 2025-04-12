import { GenerationOptions } from '../../../types/generation.types';
import { Logger } from '../../../config/logger';

export abstract class FrameworkAdapter {
  /**
   * Get default template for a component type
   */
  public abstract getDefaultTemplate(componentType: string, options: GenerationOptions): string;
  
  /**
   * Get default template for layout
   */
  public abstract getDefaultLayoutTemplate(options: GenerationOptions): string;
  
  /**
   * Get file extensions for the framework
   */
  public abstract getFileExtensions(options: GenerationOptions): string[];
  
  /**
   * Process and validate generated code
   */
  public processGeneratedCode(
    generated: any,
    options: GenerationOptions
  ): { files: Record<string, string> } {
    if (!generated || !generated.files || typeof generated.files !== 'object') {
      throw new Error('Invalid generated code: missing or invalid files property');
    }
    
    const processedFiles: Record<string, string> = {};
    
    // Process each file
    for (const [filename, content] of Object.entries(generated.files)) {
      if (typeof content !== 'string') {
        Logger.warn(`Skipping file ${filename} with non-string content`);
        continue;
      }
      
      // Validate file extension
      const validExtensions = this.getFileExtensions(options);
      const hasValidExtension = validExtensions.some(ext => filename.endsWith(ext));
      
      if (!hasValidExtension) {
        Logger.warn(`File ${filename} has invalid extension, expected one of: ${validExtensions.join(', ')}`);
        
        // Try to fix the extension
        const baseFilename = filename.split('.')[0];
        const fixedFilename = `${baseFilename}${validExtensions[0]}`;
        processedFiles[fixedFilename] = content;
      } else {
        // Process framework-specific code
        const processedContent = this.processFileContent(filename, content, options);
        processedFiles[filename] = processedContent;
      }
    }
    
    return { files: processedFiles };
  }
  
  /**
   * Process file content with framework-specific logic
   */
  protected processFileContent(filename: string, content: string, options: GenerationOptions): string {
    // Default implementation, can be overridden by specific adapters
    return content;
  }
  
  /**
   * Learn from past errors to improve code generation
   */
  public async learnFromErrors(errors: any[]): Promise<void> {
    // Default implementation, should be overridden by specific adapters
    Logger.info(`Framework adapter learning from ${errors.length} errors`);
  }
}

