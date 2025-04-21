// src/modules/style-extraction/style-extraction-agent.ts
import { ComponentRecognitionResult, DesignInputResult, ExtractedStyles } from '@/types/agent-interfaces';

export class StyleExtractionAgent {
  private onProgress?: (progress: number) => void;
  
  constructor(onProgress?: (progress: number) => void) {
    this.onProgress = onProgress;
  }
  
  async execute(
    designInput: DesignInputResult,
    componentRecognition: ComponentRecognitionResult
  ): Promise<ExtractedStyles> {
    try {
      this.updateProgress(10);
      
      // Extract colors
      const colors = this.extractColors(designInput, componentRecognition);
      this.updateProgress(30);
      
      // Extract typography
      const typography = this.extractTypography(designInput, componentRecognition);
      this.updateProgress(50);
      
      // Extract spacing
      const spacing = this.extractSpacing(designInput, componentRecognition);
      this.updateProgress(70);
      
      // Extract shadows
      const shadows = this.extractShadows(designInput, componentRecognition);
      this.updateProgress(85);
      
      // Extract breakpoints
      const breakpoints = this.extractBreakpoints(designInput);
      this.updateProgress(100);
      
      return {
        colors,
        typography,
        spacing,
        shadows,
        breakpoints
      };
    } catch (error) {
      console.error('Style Extraction Agent error:', error);
      throw new Error(`Failed to extract styles: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  private updateProgress(progress: number) {
    if (this.onProgress) {
      this.onProgress(progress);
    }
  }
  
  private extractColors(
    designInput: DesignInputResult,
    componentRecognition: ComponentRecognitionResult
  ): ExtractedStyles['colors'] {
    const colors: ExtractedStyles['colors'] = [];
    const colorMap = new Map<string, { count: number; contexts: string[] }>();
    
    // Process colors from styles
    if (designInput.styles && designInput.styles.meta && designInput.styles.meta.styles) {
      const styles = designInput.styles.meta.styles;
      
      Object.entries(styles).forEach(([styleId, style]: [string, any]) => {
        if (style.styleType === 'FILL') {
          const styleNode = this.findNodeWithStyle(designInput.figmaFile.document, styleId);
          
          if (styleNode && styleNode.fills && styleNode.fills.length > 0) {
            const fill = styleNode.fills[0];
            
            if (fill.type === 'SOLID' && fill.color) {
              const { r, g, b, a = 1 } = fill.color;
              const hex = this.rgbToHex(r, g, b);
              
              let styleName = style.name || `Color-${colors.length + 1}`;
              // Remove any numeric prefix that Figma often adds (like "800/Primary")
              styleName = styleName.replace(/^\d+\//, '');
              
              // Map to EDS variable based on name
              let edsVariable = this.mapColorNameToEDSVariable(styleName);
              
              colors.push({
                name: styleName,
                value: hex,
                edsVariable
              });
            }
          }
        }
      });
    }
    
    // Gather colors from component styles
    componentRecognition.components.forEach(component => {
      if (component.styles && component.styles.colors) {
        component.styles.colors.forEach(color => {
          // Only track solid colors
          if (color.startsWith('#')) {
            if (!colorMap.has(color)) {
              colorMap.set(color, { count: 0, contexts: [] });
            }
            
            const colorInfo = colorMap.get(color)!;
            colorInfo.count++;
            colorInfo.contexts.push(component.name);
          }
        });
      }
    });
    
    // Add frequently used colors that aren't in styles
    const existingHexValues = new Set(colors.map(c => c.value));
    
    Array.from(colorMap.entries())
      .filter(([hex, info]) => !existingHexValues.has(hex) && info.count >= 3)
      .sort((a, b) => b[1].count - a[1].count)
      .forEach(([hex, info], index) => {
        // Try to determine color name from contexts
        const colorType = this.determineColorTypeFromContexts(info.contexts);
        const name = colorType || `Color-${colors.length + 1}`;
        const edsVariable = this.mapColorNameToEDSVariable(name);
        
        colors.push({
          name,
          value: hex,
          edsVariable
        });
      });
    
    return colors;
  }
  
  private extractTypography(
    designInput: DesignInputResult,
    componentRecognition: ComponentRecognitionResult
  ): ExtractedStyles['typography'] {
    const typography: ExtractedStyles['typography'] = [];
    const typographyMap = new Map<string, { count: number; contexts: string[] }>();
    
    // Process typography from styles
    if (designInput.styles && designInput.styles.meta && designInput.styles.meta.styles) {
      const styles = designInput.styles.meta.styles;
      
      Object.entries(styles).forEach(([styleId, style]: [string, any]) => {
        if (style.styleType === 'TEXT') {
          const styleNode = this.findNodeWithStyle(designInput.figmaFile.document, styleId);
          
          if (styleNode && styleNode.style) {
            const { fontFamily, fontSize, fontWeight, lineHeight } = styleNode.style;
            
            let styleName = style.name || `Typography-${typography.length + 1}`;
            // Remove any numeric prefix that Figma often adds
            styleName = styleName.replace(/^\d+\//, '');
            
            // Map to EDS variable based on name
            let edsVariable = this.mapTypographyNameToEDSVariable(styleName);
            
            typography.push({
              name: styleName,
              fontFamily,
              fontSize: `${fontSize}px`,
              fontWeight,
              lineHeight: typeof lineHeight === 'object' 
                ? `${lineHeight.value}${lineHeight.unit}` 
                : `${lineHeight}px`,
              edsVariable
            });
          }
        }
      });
    }
    
    // Gather typography from component styles
    componentRecognition.components.forEach(component => {
      if (component.styles && component.styles.typography) {
        const { fontFamily, fontSize, fontWeight, lineHeight } = component.styles.typography;
        
        if (fontFamily && fontSize) {
          const key = `${fontFamily}-${fontSize}-${fontWeight || 'normal'}-${lineHeight || 'normal'}`;
          
          if (!typographyMap.has(key)) {
            typographyMap.set(key, { count: 0, contexts: [] });
          }
          
          const typographyInfo = typographyMap.get(key)!;
          typographyInfo.count++;
          typographyInfo.contexts.push(component.name);
        }
      }
    });
    
    // Add frequently used typography combinations that aren't in styles
    const existingTypeStyles = new Set(
      typography.map(t => `${t.fontFamily}-${t.fontSize}-${t.fontWeight}-${t.lineHeight}`)
    );
    
    Array.from(typographyMap.entries())
      .filter(([key, info]) => !existingTypeStyles.has(key) && info.count >= 3)
      .sort((a, b) => b[1].count - a[1].count)
      .forEach(([key, info], index) => {
        const [fontFamily, fontSize, fontWeight, lineHeight] = key.split('-');
        
        // Try to determine typography name from contexts
        const typeName = this.determineTypeNameFromContexts(info.contexts) || `Typography-${typography.length + 1}`;
        const edsVariable = this.mapTypographyNameToEDSVariable(typeName);
        
        typography.push({
          name: typeName,
          fontFamily,
          fontSize,
          fontWeight,
          lineHeight,
          edsVariable
        });
      });
    
    return typography;
  }
  
  private extractSpacing(
    designInput: DesignInputResult,
    componentRecognition: ComponentRecognitionResult
  ): ExtractedStyles['spacing'] {
    const spacing: ExtractedStyles['spacing'] = [];
    const spacingMap = new Map<number, number>();
    
    // Process components to find common spacing values
    componentRecognition.components.forEach(component => {
      if (component.layout) {
        // Extract padding values
        if (component.layout.padding) {
          const paddings = component.layout.padding.split(' ')
            .map(val => parseInt(val))
            .filter(val => !isNaN(val));
          
          paddings.forEach(padding => {
            spacingMap.set(padding, (spacingMap.get(padding) || 0) + 1);
          });
        }
        
        // Extract margin values
        if (component.layout.margin) {
          const margins = component.layout.margin.split(' ')
            .map(val => parseInt(val))
            .filter(val => !isNaN(val));
          
          margins.forEach(margin => {
            spacingMap.set(margin, (spacingMap.get(margin) || 0) + 1);
          });
        }
        
        // Extract gap values
        if (component.layout.gap) {
          const gap = parseInt(component.layout.gap);
          if (!isNaN(gap)) {
            spacingMap.set(gap, (spacingMap.get(gap) || 0) + 1);
          }
        }
      }
    });
    
    // Convert to array and sort by frequency
    const sortedSpacing = Array.from(spacingMap.entries())
      .filter(([value, count]) => count >= 3)  // Only include values used multiple times
      .sort((a, b) => a[0] - b[0]);  // Sort by value
    
    // Define common spacing values for the EDS system
    const commonSpacings = [0, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 128];
    
    // Add common spacing values
    commonSpacings.forEach(value => {
      spacing.push({
        name: `space-${value}`,
        value: `${value}px`,
        edsVariable: this.mapSpacingToEDSVariable(value)
      });
    });
    
    // Add specific spacing values from the design if they're not already included
    sortedSpacing.forEach(([value, count]) => {
      if (!commonSpacings.includes(value)) {
        spacing.push({
          name: `space-${value}`,
          value: `${value}px`,
          edsVariable: this.mapSpacingToEDSVariable(value)
        });
      }
    });
    
    return spacing;
  }
  
  private extractShadows(
    designInput: DesignInputResult,
    componentRecognition: ComponentRecognitionResult
  ): ExtractedStyles['shadows'] {
    const shadows: ExtractedStyles['shadows'] = [];
    const shadowMap = new Map<string, number>();
    
    // Process components to find shadow definitions
    componentRecognition.components.forEach(component => {
      // Check for shadow effects in the Figma component
      const figmaComponent = this.findComponentById(designInput.components, component.id);
      
      if (figmaComponent && figmaComponent.effects) {
        figmaComponent.effects
          .filter((effect: any) => effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW')
          .forEach((shadow: any) => {
            const { offset, radius, color, spread = 0, type } = shadow;
            const { x, y } = offset || { x: 0, y: 0 };
            const { r, g, b, a = 1 } = color || { r: 0, g: 0, b: 0, a: 1 };
            
            // Create CSS shadow
            const cssColor = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
            const cssShadow = `${type === 'INNER_SHADOW' ? 'inset ' : ''}${x}px ${y}px ${radius}px ${spread}px ${cssColor}`;
            
            shadowMap.set(cssShadow, (shadowMap.get(cssShadow) || 0) + 1);
          });
      }
    });
    
    // Define common shadow levels
    const shadowLevels = [
      { name: 'shadow-sm', value: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' },
      { name: 'shadow', value: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' },
      { name: 'shadow-md', value: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' },
      { name: 'shadow-lg', value: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' },
      { name: 'shadow-xl', value: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' },
    ];
    
    // Add common shadow values
    shadowLevels.forEach(({ name, value }) => {
      shadows.push({
        name,
        value,
        edsVariable: this.mapShadowToEDSVariable(name)
      });
    });
    
    // Add specific shadows from the design
    const customShadows = Array.from(shadowMap.entries())
      .filter(([shadow, count]) => count >= 2)  // Only include shadows used multiple times
      .sort((a, b) => b[1] - a[1]);  // Sort by frequency
    
    customShadows.forEach(([shadow, count], index) => {
      const name = `shadow-custom-${index + 1}`;
      shadows.push({
        name,
        value: shadow,
        edsVariable: this.mapShadowToEDSVariable(name)
      });
    });
    
    return shadows;
  }
  
  private extractBreakpoints(designInput: DesignInputResult): ExtractedStyles['breakpoints'] {
    // Define standard EDS breakpoints
    return [
      { name: 'xs', value: '0px', edsVariable: '--breakpoint-xs' },
      { name: 'sm', value: '576px', edsVariable: '--breakpoint-sm' },
      { name: 'md', value: '768px', edsVariable: '--breakpoint-md' },
      { name: 'lg', value: '992px', edsVariable: '--breakpoint-lg' },
      { name: 'xl', value: '1200px', edsVariable: '--breakpoint-xl' },
      { name: 'xxl', value: '1400px', edsVariable: '--breakpoint-xxl' }
    ];
  }
  
  // Helper methods
  private findNodeWithStyle(node: any, styleId: string): any {
    if (!node) return null;
    
    // Check if this node has the style
    if (node.styles) {
      for (const [propName, id] of Object.entries(node.styles)) {
        if (id === styleId) {
          return node;
        }
      }
    }
    
    // Recursively check children
    if (node.children) {
      for (const child of node.children) {
        const result = this.findNodeWithStyle(child, styleId);
        if (result) return result;
      }
    }
    
    return null;
  }
  
  private findComponentById(components: any[], id: string): any {
    return components.find(comp => comp.id === id);
  }
  
  private rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b]
      .map(x => Math.round(x * 255))
      .map(x => x.toString(16).padStart(2, '0'))
      .join('');
  }
  
  private mapColorNameToEDSVariable(name: string): string {
    const lowerName = name.toLowerCase();
    
    // Primary colors
    if (lowerName.includes('primary')) return '--primary';
    if (lowerName.includes('secondary')) return '--secondary';
    if (lowerName.includes('accent')) return '--accent';
    
    // Semantic colors
    if (lowerName.includes('success') || lowerName.includes('green')) return '--success';
    if (lowerName.includes('warning') || lowerName.includes('yellow') || lowerName.includes('orange')) return '--warning';
    if (lowerName.includes('danger') || lowerName.includes('error') || lowerName.includes('red')) return '--danger';
    if (lowerName.includes('info') || lowerName.includes('blue')) return '--info';
    
    // UI colors
    if (lowerName.includes('background')) return '--background';
    if (lowerName.includes('foreground')) return '--foreground';
    if (lowerName.includes('card')) return '--card-background';
    if (lowerName.includes('border')) return '--border';
    if (lowerName.includes('text')) return '--text';
    if (lowerName.includes('muted')) return '--muted';
    
    // Default naming pattern
    return `--color-${name.replace(/\s+/g, '-').toLowerCase()}`;
  }
  
  private mapTypographyNameToEDSVariable(name: string): string {
    const lowerName = name.toLowerCase();
    
    // Heading styles
    if (lowerName.includes('h1') || lowerName.includes('heading 1')) return '--font-h1';
    if (lowerName.includes('h2') || lowerName.includes('heading 2')) return '--font-h2';
    if (lowerName.includes('h3') || lowerName.includes('heading 3')) return '--font-h3';
    if (lowerName.includes('h4') || lowerName.includes('heading 4')) return '--font-h4';
    if (lowerName.includes('h5') || lowerName.includes('heading 5')) return '--font-h5';
    if (lowerName.includes('h6') || lowerName.includes('heading 6')) return '--font-h6';
    
    // Body styles
    if (lowerName.includes('body') && lowerName.includes('large')) return '--font-body-large';
    if (lowerName.includes('body') && lowerName.includes('small')) return '--font-body-small';
    if (lowerName.includes('body')) return '--font-body';
    
    // Other common styles
    if (lowerName.includes('caption')) return '--font-caption';
    if (lowerName.includes('label')) return '--font-label';
    if (lowerName.includes('button')) return '--font-button';
    
    // Default naming pattern
    return `--font-${name.replace(/\s+/g, '-').toLowerCase()}`;
  }
  
  private mapSpacingToEDSVariable(value: number): string {
    return `--space-${value}`;
  }
  
  private mapShadowToEDSVariable(name: string): string {
    return `--${name}`;
  }
  
  private determineColorTypeFromContexts(contexts: string[]): string | null {
    const lowerContexts = contexts.map(ctx => ctx.toLowerCase());
    
    if (lowerContexts.some(ctx => ctx.includes('button') && ctx.includes('primary'))) {
      return 'Primary';
    }
    
    if (lowerContexts.some(ctx => ctx.includes('button') && ctx.includes('secondary'))) {
      return 'Secondary';
    }
    
    if (lowerContexts.some(ctx => ctx.includes('background'))) {
      return 'Background';
    }
    
    if (lowerContexts.some(ctx => ctx.includes('text') || ctx.includes('typography'))) {
      return 'Text';
    }
    
    if (lowerContexts.some(ctx => ctx.includes('border') || ctx.includes('divider'))) {
      return 'Border';
    }
    
    if (lowerContexts.some(ctx => ctx.includes('error') || ctx.includes('danger'))) {
      return 'Error';
    }
    
    if (lowerContexts.some(ctx => ctx.includes('warning'))) {
      return 'Warning';
    }
    
    if (lowerContexts.some(ctx => ctx.includes('success'))) {
      return 'Success';
    }
    
    return null;
  }
  
  private determineTypeNameFromContexts(contexts: string[]): string | null {
    const lowerContexts = contexts.map(ctx => ctx.toLowerCase());
    
    if (lowerContexts.some(ctx => ctx.includes('heading') || ctx.includes('title'))) {
      if (lowerContexts.some(ctx => ctx.includes('large'))) {
        return 'Heading Large';
      }
      return 'Heading';
    }
    
    if (lowerContexts.some(ctx => ctx.includes('body'))) {
      if (lowerContexts.some(ctx => ctx.includes('small'))) {
        return 'Body Small';
      }
      if (lowerContexts.some(ctx => ctx.includes('large'))) {
        return 'Body Large';
      }
      return 'Body';
    }
    
    if (lowerContexts.some(ctx => ctx.includes('button'))) {
      return 'Button';
    }
    
    if (lowerContexts.some(ctx => ctx.includes('caption'))) {
      return 'Caption';
    }
    
    if (lowerContexts.some(ctx => ctx.includes('label'))) {
      return 'Label';
    }
    
    return null;
  }
}