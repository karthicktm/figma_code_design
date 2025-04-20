import { FigmaClient } from '@/lib/figma-api';
import { IAgent, DesignInputResult, DesignInputConfig } from '@/types/agent-interfaces';

export class DesignInputAgent implements IAgent {
  private apiKey: string;
  private fileId: string;
  private onProgress?: (progress: number) => void;
  
  constructor(config: DesignInputConfig, onProgress?: (progress: number) => void) {
    this.apiKey = config.apiKey;
    this.fileId = config.fileId.includes('figma.com') 
      ? config.fileId.split('/').pop()?.split('?')[0] || ''
      : config.fileId;
    this.onProgress = onProgress;
  }
  
  async execute(inputs: any[]): Promise<DesignInputResult> {
    try {
      this.updateProgress(10);
      
      // Initialize Figma client
      const figmaClient = new FigmaClient(this.apiKey);
      
      // Get file data
      this.updateProgress(20);
      const file = await figmaClient.getFile(this.fileId);
      this.updateProgress(40);
      
      // Extract components
      const components = figmaClient.extractComponentsFromFile(file);
      this.updateProgress(60);
      
      // Extract images
      const images = figmaClient.extractImagesFromFile(file);
      this.updateProgress(70);
      
      // Extract fonts
      const fonts = figmaClient.extractFontsFromFile(file);
      this.updateProgress(80);
      
      // Extract colors
      const colors = figmaClient.extractColorsFromFile(file);
      this.updateProgress(90);
      
      // Get file styles
      const styles = await figmaClient.getFileStyles(this.fileId);
      this.updateProgress(100);
      
      return {
        figmaFile: file,
        components,
        styles,
        assets: {
          images,
          icons: [], // We'll identify icons in the asset manager
          fonts: Array.from(fonts)
        }
      };
    } catch (error) {
      console.error('Design Input Agent error:', error);
      throw new Error(`Failed to process Figma design: ${error.message}`);
    }
  }
  
  private updateProgress(progress: number) {
    if (this.onProgress) {
      this.onProgress(progress);
    }
  }
  
  // Helper method to extract icons (SVG elements) from the design
  private extractIcons(figmaFile: any): any[] {
    const icons: any[] = [];
    
    const processNode = (node: any) => {
      // Identify potential icons: small vector elements, components marked as icons
      const isPotentialIcon = (
        (node.type === 'VECTOR' || node.type === 'FRAME' || node.type === 'COMPONENT') &&
        // Using size heuristic - icons are typically small and square-ish
        node.width <= 64 && 
        node.height <= 64 &&
        Math.abs(node.width - node.height) < 10
      ) || (
        // Check name for icon indicators
        node.name && 
        (node.name.toLowerCase().includes('icon') || 
         node.name.toLowerCase().includes('ico') ||
         node.name.toLowerCase().includes('symbol'))
      );
      
      if (isPotentialIcon) {
        icons.push(node);
      }
      
      // Process children
      if (node.children) {
        node.children.forEach(processNode);
      }
    };
    
    processNode(figmaFile.document);
    return icons;
  }
}