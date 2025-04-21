// src/modules/component-recognition/component-recognition-agent.ts
import { ComponentRecognitionResult, DesignInputResult, RecognizedComponent } from '@/types/agent-interfaces';
import { AssetManagerResult } from '@/types/agent-interfaces';

export class ComponentRecognitionAgent {
  private onProgress?: (progress: number) => void;
  
  constructor(onProgress?: (progress: number) => void) {
    this.onProgress = onProgress;
  }
  
  async execute(
    designInput: DesignInputResult,
    assetManager: AssetManagerResult
  ): Promise<ComponentRecognitionResult> {
    try {
      this.updateProgress(10);
      
      // Identify components from the Figma design data
      const components = await this.recognizeComponents(designInput, assetManager);
      this.updateProgress(50);
      
      // Organize components by page and layout
      const { pages, layouts } = await this.organizeComponentsByLayout(designInput, components);
      this.updateProgress(90);
      
      // Group components into meaningful patterns
      await this.identifyComponentPatterns(components);
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
  
  private async recognizeComponents(
    designInput: DesignInputResult,
    assetManager: AssetManagerResult
  ): Promise<RecognizedComponent[]> {
    const recognizedComponents: RecognizedComponent[] = [];
    
    // Process Figma components
    if (designInput.components && designInput.components.length > 0) {
      const totalComponents = designInput.components.length;
      
      for (let i = 0; i < designInput.components.length; i++) {
        const component = designInput.components[i];
        const recognizedComponent = await this.mapFigmaComponentToEDS(component, designInput);
        if (recognizedComponent) {
          recognizedComponents.push(recognizedComponent);
        }
        
        // Update progress based on component processing
        const progressIncrement = 40 / totalComponents; // 40% range from 10% to 50%
        this.updateProgress(10 + Math.round((i + 1) * progressIncrement));
      }
    }
    
    return recognizedComponents;
  }
  
  private async mapFigmaComponentToEDS(
    figmaComponent: any,
    designInput: DesignInputResult
  ): Promise<RecognizedComponent | null> {
    // Add a simulated processing delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
    
    const edsComponentType = this.determineEDSComponentType(figmaComponent);
    
    if (!edsComponentType) {
      // Skip components we can't map to EDS
      return null;
    }
    
    // Extract component properties
    const properties = this.extractComponentProperties(figmaComponent, edsComponentType);
    
    // Process children recursively if they exist
    let children: RecognizedComponent[] = [];
    if (figmaComponent.children && figmaComponent.children.length > 0) {
      for (const childComponent of figmaComponent.children) {
        const childRecognized = await this.mapFigmaComponentToEDS(childComponent, designInput);
        if (childRecognized) {
          children.push(childRecognized);
        }
      }
    }
    
    // Extract layout information
    const layout = this.extractLayoutInformation(figmaComponent);
    
    // Extract style information
    const styles = this.extractStyleInformation(figmaComponent, designInput);
    
    return {
      id: figmaComponent.id,
      name: figmaComponent.name,
      type: figmaComponent.type,
      edsComponentType,
      properties,
      children: children.length > 0 ? children : undefined,
      layout,
      styles
    };
  }
  
  private determineEDSComponentType(figmaComponent: any): string | null {
    // Logic to map Figma component to EDS component type
    // This is a simplified version for demonstration
    const name = figmaComponent.name.toLowerCase();
    const type = figmaComponent.type;
    
    // Button detection
    if (
      name.includes('button') || 
      name.includes('btn') || 
      (figmaComponent.layoutMode === 'HORIZONTAL' && 
       figmaComponent.primaryAxisAlignItems === 'CENTER' &&
       figmaComponent.counterAxisAlignItems === 'CENTER' &&
       (figmaComponent.width <= 200 && figmaComponent.height <= 48))
    ) {
      return 'Button';
    }
    
    // Card detection
    if (
      name.includes('card') || 
      name.includes('tile') ||
      (figmaComponent.type === 'FRAME' && 
       figmaComponent.cornerRadius > 0 &&
       figmaComponent.width > 200 &&
       figmaComponent.height > 150)
    ) {
      return 'Card';
    }
    
    // Input detection
    if (
      name.includes('input') || 
      name.includes('text field') || 
      name.includes('textfield') ||
      name.includes('form field')
    ) {
      return 'Input';
    }
    
    // Checkbox detection
    if (
      name.includes('checkbox') || 
      (figmaComponent.type === 'INSTANCE' && figmaComponent.width <= 24 && figmaComponent.height <= 24)
    ) {
      return 'Checkbox';
    }
    
    // Radio button detection
    if (
      name.includes('radio') || 
      name.includes('option')
    ) {
      return 'Radio';
    }
    
    // Select detection
    if (
      name.includes('select') || 
      name.includes('dropdown') || 
      name.includes('combo')
    ) {
      return 'Select';
    }
    
    // Icon detection
    if (
      name.includes('icon') ||
      (figmaComponent.width <= 32 && figmaComponent.height <= 32)
    ) {
      return 'Icon';
    }
    
    // Table detection
    if (
      name.includes('table') || 
      name.includes('data grid') || 
      name.includes('datagrid')
    ) {
      return 'Table';
    }
    
    // Modal/Dialog detection
    if (
      name.includes('modal') || 
      name.includes('dialog') || 
      name.includes('popup')
    ) {
      return 'Dialog';
    }
    
    // Tabs detection
    if (
      name.includes('tab') || 
      name.includes('tabbar')
    ) {
      return 'Tabs';
    }
    
    // Navigation detection
    if (
      name.includes('nav') || 
      name.includes('menu') || 
      name.includes('navigation')
    ) {
      return 'Navigation';
    }
    
    // Label detection
    if (
      name.includes('label') || 
      (figmaComponent.type === 'TEXT')
    ) {
      return 'Label';
    }
    
    // Generic container for frames and groups
    if (type === 'FRAME' || type === 'GROUP') {
      return 'Container';
    }
    
    // If we can't determine a specific type, default to generic component
    return null;
  }
  
  private extractComponentProperties(figmaComponent: any, edsComponentType: string): Record<string, any> {
    const properties: Record<string, any> = {};
    
    // Extract common properties
    if (figmaComponent.name) {
      properties.name = figmaComponent.name;
    }
    
    // Component-specific property extraction
    switch (edsComponentType) {
      case 'Button':
        if (figmaComponent.fills && figmaComponent.fills.length > 0) {
          const primaryFill = figmaComponent.fills[0];
          if (primaryFill.type === 'SOLID') {
            const { r, g, b } = primaryFill.color;
            const hexColor = `#${Math.round(r * 255).toString(16).padStart(2, '0')}${Math.round(g * 255).toString(16).padStart(2, '0')}${Math.round(b * 255).toString(16).padStart(2, '0')}`;
            properties.backgroundColor = hexColor;
            
            // Determine button variant based on color
            if (hexColor === '#000000' || hexColor === '#0000FF') {
              properties.variant = 'primary';
            } else if (hexColor === '#FFFFFF' || hexColor === '#F5F5F5') {
              properties.variant = 'secondary';
            } else if (hexColor === '#FF0000') {
              properties.variant = 'destructive';
            } else {
              properties.variant = 'default';
            }
          }
        }
        
        // Check if button has an icon
        if (figmaComponent.children) {
          const hasIcon = figmaComponent.children.some((child: any) => 
            child.type === 'VECTOR' || child.name.toLowerCase().includes('icon')
          );
          if (hasIcon) {
            properties.hasIcon = true;
          }
        }
        
        // Extract button text
        const textLayer = figmaComponent.children?.find((child: any) => child.type === 'TEXT');
        if (textLayer) {
          properties.text = textLayer.characters;
        }
        break;
        
      case 'Input':
        properties.type = 'text';
        
        // Check if input has a placeholder
        const textChild = figmaComponent.children?.find((child: any) => child.type === 'TEXT');
        if (textChild) {
          properties.placeholder = textChild.characters;
        }
        
        // Check for labels
        const labelChild = figmaComponent.children?.find((child: any) => 
          child.type === 'TEXT' && 
          (child.name.toLowerCase().includes('label') || child.y < figmaComponent.y)
        );
        if (labelChild) {
          properties.label = labelChild.characters;
        }
        break;
        
      case 'Card':
        // Extract card properties
        properties.hasShadow = figmaComponent.effects?.some((effect: any) => effect.type === 'DROP_SHADOW');
        properties.hasBorder = figmaComponent.strokes?.length > 0;
        properties.cornerRadius = figmaComponent.cornerRadius;
        
        // Check for card header and content
        if (figmaComponent.children) {
          const headerChild = figmaComponent.children.find((child: any) => 
            child.name.toLowerCase().includes('header') || 
            (child.type === 'FRAME' && child.y === figmaComponent.y)
          );
          
          const contentChild = figmaComponent.children.find((child: any) => 
            child.name.toLowerCase().includes('content') || 
            (child.type === 'FRAME' && child.y > figmaComponent.y)
          );
          
          properties.hasHeader = !!headerChild;
          properties.hasContent = !!contentChild;
        }
        break;
        
      // Add more component types as needed
      default:
        // For unknown component types, try to extract generic properties
        if (figmaComponent.fills && figmaComponent.fills.length > 0) {
          properties.hasFill = true;
        }
        
        if (figmaComponent.strokes && figmaComponent.strokes.length > 0) {
          properties.hasBorder = true;
        }
    }
    
    return properties;
  }
  
  private extractLayoutInformation(figmaComponent: any): RecognizedComponent['layout'] {
    const layout: RecognizedComponent['layout'] = {
      width: figmaComponent.width || 'auto',
      height: figmaComponent.height || 'auto'
    };
    
    // Extract layout properties if available
    if (figmaComponent.layoutMode) {
      layout.position = 'relative';
      
      if (figmaComponent.layoutMode === 'HORIZONTAL') {
        layout.display = 'flex';
        layout.flexDirection = 'row';
      } else if (figmaComponent.layoutMode === 'VERTICAL') {
        layout.display = 'flex';
        layout.flexDirection = 'column';
      }
      
      // Extract spacing
      if (figmaComponent.itemSpacing !== undefined) {
        layout.gap = `${figmaComponent.itemSpacing}px`;
      }
      
      // Extract padding
      if (figmaComponent.paddingLeft !== undefined ||
          figmaComponent.paddingRight !== undefined ||
          figmaComponent.paddingTop !== undefined ||
          figmaComponent.paddingBottom !== undefined) {
        layout.padding = `${figmaComponent.paddingTop || 0}px ${figmaComponent.paddingRight || 0}px ${figmaComponent.paddingBottom || 0}px ${figmaComponent.paddingLeft || 0}px`;
      }
    }
    
    // Extract position if absolute
    if (figmaComponent.parent && figmaComponent.parent.type === 'FRAME') {
      layout.position = 'absolute';
      layout.top = `${figmaComponent.y - (figmaComponent.parent?.y || 0)}px`;
      layout.left = `${figmaComponent.x - (figmaComponent.parent?.x || 0)}px`;
    }
    
    return layout;
  }
  
  private extractStyleInformation(figmaComponent: any, designInput: DesignInputResult): RecognizedComponent['styles'] {
    const styles: NonNullable<RecognizedComponent['styles']> = {};
    
    // Extract color styles
    const colors: string[] = [];
    
    // Check fills
    if (figmaComponent.fills && figmaComponent.fills.length > 0) {
      figmaComponent.fills.forEach((fill: any) => {
        if (fill.type === 'SOLID') {
          const { r, g, b } = fill.color;
          colors.push(`#${Math.round(r * 255).toString(16).padStart(2, '0')}${Math.round(g * 255).toString(16).padStart(2, '0')}${Math.round(b * 255).toString(16).padStart(2, '0')}`);
        }
      });
    }
    
    // Check strokes
    if (figmaComponent.strokes && figmaComponent.strokes.length > 0) {
      figmaComponent.strokes.forEach((stroke: any) => {
        if (stroke.type === 'SOLID') {
          const { r, g, b } = stroke.color;
          colors.push(`#${Math.round(r * 255).toString(16).padStart(2, '0')}${Math.round(g * 255).toString(16).padStart(2, '0')}${Math.round(b * 255).toString(16).padStart(2, '0')}`);
        }
      });
    }
    
    if (colors.length > 0) {
      styles.colors = colors;
    }
    
    // Extract typography styles
    if (figmaComponent.type === 'TEXT' && figmaComponent.style) {
      styles.typography = {
        fontFamily: figmaComponent.style.fontFamily,
        fontSize: `${figmaComponent.style.fontSize}px`,
        fontWeight: figmaComponent.style.fontWeight,
        lineHeight: figmaComponent.style.lineHeight ? 
          (typeof figmaComponent.style.lineHeight === 'object' ? `${figmaComponent.style.lineHeight.value}${figmaComponent.style.lineHeight.unit}` : `${figmaComponent.style.lineHeight}px`) : 
          'normal',
        letterSpacing: figmaComponent.style.letterSpacing ? 
          (typeof figmaComponent.style.letterSpacing === 'object' ? `${figmaComponent.style.letterSpacing.value}${figmaComponent.style.letterSpacing.unit}` : `${figmaComponent.style.letterSpacing}px`) : 
          'normal',
        textAlign: figmaComponent.style.textAlignHorizontal ? figmaComponent.style.textAlignHorizontal.toLowerCase() : 'left',
        textCase: figmaComponent.style.textCase ? 
          figmaComponent.style.textCase === 'UPPER' ? 'uppercase' : 
          figmaComponent.style.textCase === 'LOWER' ? 'lowercase' : 
          figmaComponent.style.textCase === 'TITLE' ? 'capitalize' : 
          'none' : 
          'none'
      };
    }
    
    return Object.keys(styles).length > 0 ? styles : undefined;
  }
  
  private async organizeComponentsByLayout(
    designInput: DesignInputResult, 
    components: RecognizedComponent[]
  ): Promise<{ pages: any[], layouts: any[] }> {
    const pages: any[] = [];
    const layouts: any[] = [];
    
    // Process Figma file structure to identify pages and layouts
    if (designInput.figmaFile && designInput.figmaFile.document) {
      const document = designInput.figmaFile.document;
      
      // Extract pages
      if (document.children) {
        const totalPages = document.children.length;
        
        for (let i = 0; i < document.children.length; i++) {
          const page = document.children[i];
          pages.push({
            id: page.id,
            name: page.name,
            components: components.filter(c => 
              c.id.startsWith(page.id) || // Direct children of the page
              document.children.some((child: { id: string; children?: { id: string }[] }) => child.id === page.id && child.children?.some((cc: any) => cc.id === c.id)) // Indirect children
            )
          });
          
          // Extract layouts from the pages
          if (page.children) {
            for (const frame of page.children) {
              if (frame.type === 'FRAME' && frame.layoutMode) {
                layouts.push({
                  id: frame.id,
                  name: frame.name,
                  parentPage: page.id,
                  layoutType: frame.layoutMode === 'HORIZONTAL' ? 'row' : 'column',
                  components: components.filter(c => 
                    c.id.startsWith(frame.id) || // Direct children of the frame
                    frame.children?.some((fc: any) => fc.id === c.id) // Indirect children
                  )
                });
              }
            }
          }
          
          // Update progress from 50% to 90% based on page processing
          const progressIncrement = 40 / totalPages; // 40% range from 50% to 90%
          this.updateProgress(50 + Math.round((i + 1) * progressIncrement));
        }
      }
    }
    
    return { pages, layouts };
  }
  
  private async identifyComponentPatterns(components: RecognizedComponent[]): Promise<void> {
    // Group components into common UI patterns
    // This is a simplified implementation for demonstration
    
    // Example: Identify form patterns
    const formComponents = components.filter(c => 
      c.edsComponentType === 'Input' || 
      c.edsComponentType === 'Select' || 
      c.edsComponentType === 'Checkbox' || 
      c.edsComponentType === 'Radio' || 
      c.edsComponentType === 'Button'
    );
    
    // Group form components that are close to each other
    const formGroups: RecognizedComponent[][] = [];
    let currentGroup: RecognizedComponent[] = [];
    
    formComponents.sort((a, b) => {
      const aTop = a.layout?.top ? parseInt(a.layout.top as string) : 0;
      const bTop = b.layout?.top ? parseInt(b.layout.top as string) : 0;
      return aTop - bTop;
    });
    
    for (let i = 0; i < formComponents.length; i++) {
      const current = formComponents[i];
      const next = formComponents[i + 1];
      
      currentGroup.push(current);
      
      if (!next || 
          !current.layout?.top || 
          !next.layout?.top || 
          Math.abs(parseInt(next.layout.top as string) - parseInt(current.layout.top as string)) > 100) {
        if (currentGroup.length > 1) {
          formGroups.push([...currentGroup]);
        }
        currentGroup = [];
      }
    }
    
    // Tag components that are part of forms
    formGroups.forEach((group, index) => {
      group.forEach(component => {
        component.pattern = `form-${index}`;
      });
    });
    
    // Similar logic could be applied for other patterns like navigation, cards list, etc.
  }
}