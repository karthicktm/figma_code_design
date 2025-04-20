import axios from 'axios';

// Define interfaces for Figma API responses
export interface FigmaFile {
  document: any;
  components: Record<string, any>;
  schemaVersion: number;
  styles: Record<string, any>;
  name: string;
}

export interface FigmaNode {
  id: string;
  document: any;
}

export interface FigmaImageResponse {
  err: string | null;
  images: Record<string, string>;
}

export class FigmaClient {
  private readonly API_BASE_URL = 'https://api.figma.com/v1';
  private readonly headers: Record<string, string>;
  
  constructor(apiKey: string) {
    this.headers = {
      'X-Figma-Token': apiKey
    };
  }
  
  async getFile(fileId: string): Promise<FigmaFile> {
    try {
      const response = await axios.get(`${this.API_BASE_URL}/files/${fileId}`, {
        headers: this.headers
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching Figma file:', error);
      throw new Error(`Failed to fetch Figma file: ${error.message}`);
    }
  }
  
  async getNode(fileId: string, nodeId: string): Promise<FigmaNode> {
    try {
      const response = await axios.get(
        `${this.API_BASE_URL}/files/${fileId}/nodes?ids=${nodeId}`,
        { headers: this.headers }
      );
      return response.data.nodes[nodeId];
    } catch (error) {
      console.error('Error fetching Figma node:', error);
      throw new Error(`Failed to fetch Figma node: ${error.message}`);
    }
  }
  
  async getFileNodes(fileId: string, nodeIds: string[]): Promise<Record<string, FigmaNode>> {
    try {
      const idsParam = nodeIds.join(',');
      const response = await axios.get(
        `${this.API_BASE_URL}/files/${fileId}/nodes?ids=${idsParam}`,
        { headers: this.headers }
      );
      return response.data.nodes;
    } catch (error) {
      console.error('Error fetching Figma nodes:', error);
      throw new Error(`Failed to fetch Figma nodes: ${error.message}`);
    }
  }
  
  async getImageFills(fileId: string, nodeIds: string[], format: 'png' | 'svg' | 'jpg' = 'png', scale: number = 2): Promise<FigmaImageResponse> {
    try {
      const idsParam = nodeIds.join(',');
      const response = await axios.get(
        `${this.API_BASE_URL}/files/${fileId}/images?ids=${idsParam}&format=${format}&scale=${scale}`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching Figma image fills:', error);
      throw new Error(`Failed to fetch Figma image fills: ${error.message}`);
    }
  }
  
  async getImageAsset(imageUrl: string): Promise<ArrayBuffer> {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer'
      });
      return response.data;
    } catch (error) {
      console.error('Error downloading image asset:', error);
      throw new Error(`Failed to download image asset: ${error.message}`);
    }
  }
  
  async getFileStyles(fileId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.API_BASE_URL}/files/${fileId}/styles`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching Figma styles:', error);
      throw new Error(`Failed to fetch Figma styles: ${error.message}`);
    }
  }
  
  extractComponentsFromFile(file: FigmaFile): any[] {
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
  
  extractImagesFromFile(file: FigmaFile): any[] {
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
  
  extractFontsFromFile(file: FigmaFile): Set<string> {
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
  
  extractColorsFromFile(file: FigmaFile): any[] {
    const colors: any[] = [];
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
            
            colors.push({
              hex,
              rgba: `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`
            });
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