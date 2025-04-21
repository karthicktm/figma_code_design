import { IAgent, DesignInputResult, ComponentRecognitionResult, RecognizedComponent } from '@/types/agent-interfaces';

// A mapping of Figma node types to potential EDS components
const EDS_COMPONENT_MAPPING = {
  FRAME: [
    { name: 'card', conditions: (node: any) => node.name.toLowerCase().includes('card') },
    { name: 'tab', conditions: (node: any) => node.name.toLowerCase().includes('tab') },
    { name: 'dialog', conditions: (node: any) => node.name.toLowerCase().includes('dialog') || node.name.toLowerCase().includes('modal') },
    { name: 'tile', conditions: (node: any) => node.name.toLowerCase().includes('tile') },
    { name: 'container', conditions: () => true } // Default fallback
  ],
  TEXT: [
    { name: 'title', conditions: (node: any) => node.style && node.style.fontSize >= 24 },
    { name: 'subtitle', conditions: (node: any) => node.style && node.style.fontSize >= 18 && node.style.fontSize < 24 },
    { name: 'label', conditions: (node: any) => node.name.toLowerCase().includes('label') },
    { name: 'text', conditions: () => true } // Default fallback
  ],
  RECTANGLE: [
    { name: 'button', conditions: (node: any) => node.name.toLowerCase().includes('button') || node.name.toLowerCase().includes('btn') },
    { name: 'input', conditions: (node: any) => node.name.toLowerCase().includes('input') || node.name.toLowerCase().includes('field') },
    { name: 'divider', conditions: (node: any) => (node.width > node.height * 5) || (node.height > node.width * 5) },
    { name: 'box', conditions: () => true } // Default fallback
  ],
  GROUP: [
    { name: 'form-group', conditions: (node: any) => node.name.toLowerCase().includes('form') },
    { name: 'group', conditions: () => true } // Default fallback
  ],
  COMPONENT: [
    { name: 'eds-component', conditions: () => true } // We'll try to determine specific type later
  ],
  INSTANCE: [
    { name: 'eds-component-instance', conditions: () => true } // We'll try to determine specific type later
  ]
};

export class ComponentRecognitionAgent implements IAgent {
  private onProgress?: (progress: number) => void;
  
  constructor(onProgress?: (progress: number) => void) {
    this.onProgress = onProgress;
  }
  
  async execute(inputs: any[]): Promise<ComponentRecognitionResult> {
    try {
      if (!inputs[0]) {
        throw new Error('No design input provided');
      }
      
      const designInput = inputs[0] as DesignInputResult;
      this.updateProgress(10);
      
      // Extract main pages/frames from the design
      const pages = this.extractPages(designInput.figmaFile.document);
      this.updateProgress(30);
      
      // Identify common layouts
      const layouts = this.identifyLayouts(designInput.figmaFile.document);
      this.updateProgress(50);
      
      // Recognize components from the design
      const components = this.recognizeComponents(designInput.figmaFile.document);
      this.updateProgress(100);
      
      return {
        components,
        pages,
        layouts
      };
    } catch (error) {
      console.error('Component Recognition Agent error:', error);
      throw new Error(`Failed to recognize components: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  private updateProgress(progress: number) {
    if (this.onProgress) {
      this.onProgress(progress);
    }
  }
  
  private extractPages(document: any): any[] {
    // In Figma, the top-level frames in the document are like "pages" or "screens"
    const pages: any[] = [];
    
    if (document.children) {
      // Figma's first level is usually the "Page" container
      document.children.forEach((page: any) => {
        if (page.type === 'CANVAS') {
          // Get the top-level frames in each canvas/page
          const frames = page.children.filter((node: any) => 
            node.type === 'FRAME' && 
            (!node.parent || node.parent.type === 'CANVAS')
          );
          
          pages.push({
            name: page.name,
            id: page.id,
            frames: frames.map((frame: any) => ({
              id: frame.id,
              name: frame.name,
              width: frame.width,
              height: frame.height
            }))
          });
        }
      });
    }
    
    return pages;
  }
  
  private identifyLayouts(document: any): any[] {
    // Identify common layout patterns like grids, flex containers, etc.
    const layouts: any[] = [];
    
    const processNode = (node: any) => {
      // Check for layout-specific properties in Figma
      if (node.layoutMode === 'HORIZONTAL') {
        layouts.push({
          id: node.id,
          name: node.name,
          type: 'row',
          properties: {
            padding: node.paddingLeft && node.paddingRight ? 
              `${node.paddingTop || 0} ${node.paddingRight || 0} ${node.paddingBottom || 0} ${node.paddingLeft || 0}` : 
              undefined,
            gap: node.itemSpacing,
            alignment: node.primaryAxisAlignItems === 'CENTER' ? 'center' : 
                       node.primaryAxisAlignItems === 'MAX' ? 'flex-end' : 'flex-start',
            width: node.width,
            height: node.height
          }
        });
      } else if (node.layoutMode === 'VERTICAL') {
        layouts.push({
          id: node.id,
          name: node.name,
          type: 'column',
          properties: {
            padding: node.paddingLeft && node.paddingRight ? 
              `${node.paddingTop || 0} ${node.paddingRight || 0} ${node.paddingBottom || 0} ${node.paddingLeft || 0}` : 
              undefined,
            gap: node.itemSpacing,
            alignment: node.primaryAxisAlignItems === 'CENTER' ? 'center' : 
                       node.primaryAxisAlignItems === 'MAX' ? 'flex-end' : 'flex-start',
            width: node.width,
            height: node.height
          }
        });
      } else if (node.layoutGrids && node.layoutGrids.length > 0) {
        // Handle grid layouts
        const grid = node.layoutGrids[0]; // Take the first grid definition
        layouts.push({
          id: node.id,
          name: node.name,
          type: 'grid',
          properties: {
            columns: grid.pattern === 'COLUMNS' ? grid.count : undefined,
            rows: grid.pattern === 'ROWS' ? grid.count : undefined,
            cellSize: grid.sectionSize,
            gap: grid.gutterSize,
            width: node.width,
            height: node.height
          }
        });
      }
      
      // Process children
      if (node.children) {
        node.children.forEach(processNode);
      }
    };
    
    processNode(document);
    return layouts;
  }
  
  private recognizeComponents(document: any): RecognizedComponent[] {
    const components: RecognizedComponent[] = [];
    
    const processNode = (node: any, parent?: RecognizedComponent): RecognizedComponent | null => {
      // Skip hidden nodes
      if (node.visible === false) {
        return null;
      }
      
      // Try to map to EDS component
      const edsComponentType = this.mapToEDSComponent(node);
      
      // Extract properties
      const properties = this.extractProperties(node, edsComponentType);
      
      // Create component object
      const component: RecognizedComponent = {
        id: node.id,
        name: node.name.replace(/[^a-zA-Z0-9]/g, ''),
        type: node.type,
        edsComponentType,
        properties,
        layout: {
          width: typeof node.width === 'number' ? `${node.width}px` : node.width,
          height: typeof node.height === 'number' ? `${node.height}px` : node.height,
          position: node.constraints && node.constraints.horizontal 
            ? node.constraints.horizontal.toLowerCase() 
            : undefined
        },
        children: []
      };
      
      // Extract styles
      if (node.fills || node.strokes || node.styles) {
        component.styles = this.extractStyles(node);
      }
      
      // Process children
      if (node.children && node.children.length > 0) {
        node.children.forEach((child: any) => {
          const childComponent = processNode(child, component);
          if (childComponent) {
            if (!component.children) {
              component.children = [];
            }
            component.children.push(childComponent);
          }
        });
      }
      
      // Add to main components list if it's a root component or a significant component
      if (!parent || this.isSignificantComponent(node)) {
        components.push(component);
      }
      
      return component;
    };
    
    // Start processing from the document
    if (document.children) {
      document.children.forEach((canvas: any) => {
        if (canvas.type === 'CANVAS') {
          canvas.children.forEach((node: any) => {
            processNode(node);
          });
        }
      });
    }
    
    return components;
  }
  
  private mapToEDSComponent(node: any): string {
    // Check if we have mappings for this node type
    const mappings = EDS_COMPONENT_MAPPING[node.type as keyof typeof EDS_COMPONENT_MAPPING];
    if (!mappings) {
      return 'unknown';
    }
    
    // Try to find a more specific component type based on node properties
    for (const mapping of mappings) {
      if (mapping.conditions(node)) {
        return mapping.name;
      }
    }
    
    // Fallback to generic type
    return node.type.toLowerCase();
  }
  
  private extractProperties(node: any, componentType: string): Record<string, any> {
    const properties: Record<string, any> = {};
    
    // Common properties
    properties.id = node.id;
    
    // Text properties
    if (node.type === 'TEXT') {
      properties.text = node.characters || '';
      
      if (node.style) {
        properties.fontSize = node.style.fontSize;
        properties.fontFamily = node.style.fontFamily;
        properties.fontWeight = node.style.fontWeight;
        properties.textAlign = node.style.textAlignHorizontal?.toLowerCase();
        properties.lineHeight = node.style.lineHeightPercent 
          ? `${node.style.lineHeightPercent}%` 
          : node.style.lineHeightPx 
          ? `${node.style.lineHeightPx}px` 
          : undefined;
        
        // Text color
        if (node.fills && node.fills.length > 0 && node.fills[0].type === 'SOLID') {
          const fill = node.fills[0];
          properties.color = `rgba(${Math.round(fill.color.r * 255)}, ${Math.round(fill.color.g * 255)}, ${Math.round(fill.color.b * 255)}, ${fill.color.a || 1})`;
        }
      }
    }
    
    // Button properties
    if (componentType === 'button') {
      // Check if it has text child
      if (node.children) {
        const textChild = node.children.find((child: any) => child.type === 'TEXT');
        if (textChild) {
          properties.text = textChild.characters || '';
        }
      }
      
      // Try to determine button type
      if (node.name.toLowerCase().includes('primary')) {
        properties.variant = 'primary';
      } else if (node.name.toLowerCase().includes('secondary')) {
        properties.variant = 'secondary';
      } else if (node.name.toLowerCase().includes('ghost') || node.name.toLowerCase().includes('tertiary')) {
        properties.variant = 'ghost';
      } else {
        properties.variant = 'default';
      }
      
      // Check if it has icon
      if (node.children) {
        const iconChild = node.children.find((child: any) => 
          child.type === 'VECTOR' || 
          child.name.toLowerCase().includes('icon')
        );
        if (iconChild) {
          properties.hasIcon = true;
          properties.iconPosition = 'left'; // Default
        }
      }
    }
    
    // Input properties
    if (componentType === 'input') {
      // Check if it has a label
      if (node.children) {
        const labelChild = node.children.find((child: any) => 
          child.type === 'TEXT' && 
          (child.name.toLowerCase().includes('label') || 
          child.characters?.length < 20)
        );
        if (labelChild) {
          properties.label = labelChild.characters || '';
        }
        
        // Check for placeholder
        const placeholderChild = node.children.find((child: any) => 
          child.type === 'TEXT' && 
          (child.name.toLowerCase().includes('placeholder') || 
          child.style?.opacity < 1)
        );
        if (placeholderChild) {
          properties.placeholder = placeholderChild.characters || '';
        }
      }
      
      // Check for input type hints
      if (node.name.toLowerCase().includes('password')) {
        properties.type = 'password';
      } else if (node.name.toLowerCase().includes('email')) {
        properties.type = 'email';
      } else if (node.name.toLowerCase().includes('number')) {
        properties.type = 'number';
      } else {
        properties.type = 'text';
      }
    }
    
    // Card properties
    if (componentType === 'card' || componentType === 'tile') {
      // Check for header/content structure
      if (node.children) {
        const headerChild = node.children.find((child: any) => 
          child.name.toLowerCase().includes('header') ||
          (child.children && child.children.some((c: any) => 
            c.type === 'TEXT' && c.style && c.style.fontSize >= 16
          ))
        );
        
        if (headerChild) {
          properties.hasHeader = true;
          
          // Look for title in header
          if (headerChild.children) {
            const titleChild = headerChild.children.find((child: any) => 
              child.type === 'TEXT' && child.style && child.style.fontSize >= 16
            );
            if (titleChild) {
              properties.title = titleChild.characters || '';
            }
          }
        }
        
        // Check for content section
        const contentChild = node.children.find((child: any) => 
          child.name.toLowerCase().includes('content') ||
          child.name.toLowerCase().includes('body')
        );
        
        if (contentChild) {
          properties.hasContent = true;
        }
        
        // Check for footer
        const footerChild = node.children.find((child: any) => 
          child.name.toLowerCase().includes('footer')
        );
        
        if (footerChild) {
          properties.hasFooter = true;
        }
      }
    }
    
    return properties;
  }
  
  private extractStyles(node: any): { colors?: string[], typography?: any } {
    const styles: { colors?: string[], typography?: any } = {};
    
    // Extract colors from fills
    if (node.fills && node.fills.length > 0) {
      styles.colors = node.fills
        .filter((fill: any) => fill.type === 'SOLID')
        .map((fill: any) => {
          const { r, g, b, a = 1 } = fill.color;
          return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
        });
    }
    
    // Extract typography styles
    if (node.style) {
      styles.typography = {
        fontFamily: node.style.fontFamily,
        fontSize: node.style.fontSize,
        fontWeight: node.style.fontWeight,
        lineHeight: node.style.lineHeightPercent ? 
          `${node.style.lineHeightPercent}%` : 
          node.style.lineHeightPx ? 
          `${node.style.lineHeightPx}px` : 
          'normal',
        textAlign: node.style.textAlignHorizontal?.toLowerCase(),
        textCase: node.style.textCase === 'UPPER' ? 
          'uppercase' : 
          node.style.textCase === 'LOWER' ? 
          'lowercase' : 
          node.style.textCase === 'TITLE' ? 
          'capitalize' : 
          'none'
      };
    }
    
    return styles;
  }
  
  private isSignificantComponent(node: any): boolean {
    // Determine if a node is a significant component that should be tracked separately
    
    // Components and component instances are always significant
    if (node.type === 'COMPONENT' || node.type === 'INSTANCE') {
      return true;
    }
    
    // Frames with specific names might be significant
    if (node.type === 'FRAME') {
      const name = node.name.toLowerCase();
      if (
        name.includes('card') || 
        name.includes('dialog') || 
        name.includes('modal') || 
        name.includes('component')
      ) {
        return true;
      }
    }
    
    // Nodes that might be buttons
    if (node.type === 'RECTANGLE' || node.type === 'GROUP') {
      const name = node.name.toLowerCase();
      if (
        name.includes('button') || 
        name.includes('btn')
      ) {
        return true;
      }
    }
    
    // Nodes that might be inputs
    if (node.type === 'RECTANGLE' || node.type === 'GROUP') {
      const name = node.name.toLowerCase();
      if (
        name.includes('input') || 
        name.includes('field') || 
        name.includes('form')
      ) {
        return true;
      }
    }
    
    return false;
  }
}