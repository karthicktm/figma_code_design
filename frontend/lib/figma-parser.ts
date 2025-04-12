// lib/figma-parser.ts
/**
 * Client-side utilities for parsing and processing Figma data
 */

interface FigmaNode {
    id: string;
    name: string;
    type: string;
    children?: string[];
    properties?: Record<string, any>;
    pattern?: string;
    patternConfidence?: number;
}

export class FigmaParser {
    /**
     * Extract component information from Figma data
     */
    public static extractComponents(figmaData: any): FigmaNode[] {
      const components: FigmaNode[] = [];
      
      // Process the document to find components
      if (figmaData && figmaData.document) {
        this.findComponents(figmaData.document, components);
      }
      
      return components;
    }
    
    /**
     * Recursively find components in the Figma document
     */
    private static findComponents(node: any, components: FigmaNode[]): void {
      if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
        components.push({
          id: node.id,
          name: node.name,
          type: node.type,
          children: node.children?.map((child: any) => child.id),
          properties: node.properties,
          pattern: node.pattern,
          patternConfidence: node.patternConfidence
        });
      }
      
      if (node.children) {
        node.children.forEach((child: any) => this.findComponents(child, components));
      }
    }
    
    /**
     * Extract color styles from Figma data
     */
    public static extractColorStyles(figmaData: any): Record<string, any> {
      const colorStyles: Record<string, any> = {};
      
      // Check if styles exist in the Figma data
      if (figmaData && figmaData.styles) {
        // Find color styles
        for (const [id, style] of Object.entries(figmaData.styles)) {
          if ((style as any).styleType === 'FILL') {
            colorStyles[id] = {
              id,
              name: (style as any).name,
              type: 'color'
            };
          }
        }
      }
      
      return colorStyles;
    }
    
    /**
     * Extract text styles from Figma data
     */
    public static extractTextStyles(figmaData: any): Record<string, any> {
      const textStyles: Record<string, any> = {};
      
      // Check if styles exist in the Figma data
      if (figmaData && figmaData.styles) {
        // Find text styles
        for (const [id, style] of Object.entries(figmaData.styles)) {
          if ((style as any).styleType === 'TEXT') {
            textStyles[id] = {
              id,
              name: (style as any).name,
              type: 'text'
            };
          }
        }
      }
      
      return textStyles;
    }
    
    /**
     * Parse Figma file JSON data
     */
    public static parseFigmaFile(fileData: string): any {
      try {
        return JSON.parse(fileData);
      } catch (error) {
        throw new Error('Invalid Figma file format');
      }
    }
    
    /**
     * Flatten the Figma node structure for easier processing
     */
    public static flattenNodeStructure(figmaData: any): FigmaNode[] {
      const flatNodes: FigmaNode[] = [];
      
      const processNode = (node: any) => {
        // Create a simplified node
        const simplifiedNode: FigmaNode = {
          id: node.id,
          name: node.name,
          type: node.type,
          children: []
        };
        
        // Add to flat list
        flatNodes.push(simplifiedNode);
        
        // Process children
        if (node.children && Array.isArray(node.children)) {
          for (const child of node.children) {
            // Add child ID to parent's children array
            simplifiedNode.children?.push(child.id);
            
            // Process child recursively
            processNode(child);
          }
        }
      };
      
      // Start processing from the document
      if (figmaData && figmaData.document) {
        processNode(figmaData.document);
      }
      
      return flatNodes;
    }
    
    /**
     * Get an overview of the Figma file structure
     */
    public static getFileOverview(figmaData: any): {
      name: string;
      lastModified: string;
      pageCount: number;
      componentCount: number;
    } {
      let componentCount = 0;
      
      // Count components
      const countComponents = (node: any) => {
        if (node.type === 'COMPONENT' || node.type === 'INSTANCE') {
          componentCount++;
        }
        
        if (node.children && Array.isArray(node.children)) {
          for (const child of node.children) {
            countComponents(child);
          }
        }
      };
      
      // Process document to count components
      if (figmaData && figmaData.document) {
        countComponents(figmaData.document);
      }
      
      return {
        name: figmaData?.name || 'Untitled Figma File',
        lastModified: figmaData?.lastModified || new Date().toISOString(),
        pageCount: figmaData?.document?.children?.length || 0,
        componentCount
      };
    }
  }
