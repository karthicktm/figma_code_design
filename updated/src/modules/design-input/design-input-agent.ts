// src/modules/design-input/design-input-agent.ts
import { DesignInputResult } from '@/types/agent-interfaces';


export class DesignInputAgent {
  private apiKey: string;
  private fileId: string;
  private onProgress?: (progress: number) => void;
  
  constructor(apiKey: string, fileId: string, onProgress?: (progress: number) => void) {
    this.apiKey = apiKey;
    // Extract file ID manually if it's a URL
    this.fileId = fileId.includes('/') ? this.extractFigmaIdFromUrl(fileId) : fileId;
    this.onProgress = onProgress;
  }

  private extractFigmaIdFromUrl(fileIdOrUrl: string): string {
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
  
  async execute(): Promise<DesignInputResult> {
    try {
      // Track progress
      this.updateProgress(10);
      
      // Fetch Figma file data
      const file = await this.getFile();
      this.updateProgress(40);
      
      // Extract components
      const components = this.extractComponentsFromFile(file);
      this.updateProgress(60);
      
      // Extract images
      const images = this.extractImagesFromFile(file);
      this.updateProgress(70);
      
      // Extract fonts
      const fonts = this.extractFontsFromFile(file);
      this.updateProgress(80);
      
      // Extract colors
      const colors = this.extractColorsFromFile(file);
      this.updateProgress(90);
      
      // Get file styles
      const styles = await this.getFileStyles();
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
      throw new Error(`Failed to process Figma design: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  private updateProgress(progress: number) {
    if (this.onProgress) {
      this.onProgress(progress);
    }
  }
  
  private async getFile(): Promise<any> {
    const response = await fetch(`https://api.figma.com/v1/files/${this.fileId}`, {
      headers: {
        'X-Figma-Token': this.apiKey
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Figma file: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  private async getFileStyles(): Promise<any> {
    const response = await fetch(`https://api.figma.com/v1/files/${this.fileId}/styles`, {
      headers: {
        'X-Figma-Token': this.apiKey
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Figma styles: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  private extractComponentsFromFile(file: any): any[] {
    const components: any[] = [];
    
    const processNode = (node: any) => {
      if (node.type === 'COMPONENT' || node.type === 'INSTANCE') {
        components.push(node);
      }
      
      if (node.children) {
        node.children.forEach(processNode);
      }
    };
    
    processNode(file.document);
    return components;
  }
  
  private extractImagesFromFile(file: any): any[] {
    const images: any[] = [];
    
    const processNode = (node: any) => {
      // Check if node has fills that are images
      if (node.fills && Array.isArray(node.fills)) {
        node.fills.forEach((fill: any) => {
          if (fill.type === 'IMAGE') {
            images.push({
              nodeId: node.id,
              imageRef: fill.imageRef
            });
          }
        });
      }
      
      // Process child nodes
      if (node.children) {
        node.children.forEach(processNode);
      }
    };
    
    processNode(file.document);
    return images;
  }
  
  private extractFontsFromFile(file: any): Set<string> {
    const fonts = new Set<string>();
    
    const processNode = (node: any) => {
      if (node.style && node.style.fontFamily) {
        fonts.add(node.style.fontFamily);
      }
      
      if (node.children) {
        node.children.forEach(processNode);
      }
    };
    
    processNode(file.document);
    return fonts;
  }
  
  private extractColorsFromFile(file: any): any[] {
    const colors: any[] = [];
    const colorSet = new Set<string>(); // To track unique colors
    
    const processNode = (node: any) => {
      if (node.fills && Array.isArray(node.fills)) {
        node.fills.forEach((fill: any) => {
          if (fill.type === 'SOLID' && fill.color) {
            const { r, g, b, a = 1 } = fill.color;
            // Convert to hex
            const hex = '#' + 
              Math.round(r * 255).toString(16).padStart(2, '0') +
              Math.round(g * 255).toString(16).padStart(2, '0') +
              Math.round(b * 255).toString(16).padStart(2, '0');
            
            if (!colorSet.has(hex)) {
              colorSet.add(hex);
              colors.push({
                hex,
                rgba: `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`
              });
            }
          }
        });
      }
      
      // Process strokes for border colors
      if (node.strokes && Array.isArray(node.strokes)) {
        node.strokes.forEach((stroke: any) => {
          if (stroke.type === 'SOLID' && stroke.color) {
            const { r, g, b, a = 1 } = stroke.color;
            const hex = '#' + 
              Math.round(r * 255).toString(16).padStart(2, '0') +
              Math.round(g * 255).toString(16).padStart(2, '0') +
              Math.round(b * 255).toString(16).padStart(2, '0');
            
            if (!colorSet.has(hex)) {
              colorSet.add(hex);
              colors.push({
                hex,
                rgba: `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`
              });
            }
          }
        });
      }
      
      if (node.children) {
        node.children.forEach(processNode);
      }
    };
    
    processNode(file.document);
    return colors;
  }
}
