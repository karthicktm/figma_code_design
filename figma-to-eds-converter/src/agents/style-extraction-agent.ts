import { IAgent, DesignInputResult, ComponentRecognitionResult, ExtractedStyles } from '@/types/agent-interfaces';

// Map common color values to EDS variables
const EDS_COLOR_MAP: Record<string, string> = {
  // Light theme
  '#ffffff': 'var(--white)',
  '#000000': 'var(--black)',
  '#005499': 'var(--blue-48)',
  '#1374ba': 'var(--blue-43)',
  '#0076ce': 'var(--blue-41)',
  '#2c95d6': 'var(--blue-39)',
  '#0b86cd': 'var(--blue-40)',
  '#f2f2f2': 'var(--gray-5)',
  '#e5e5e5': 'var(--gray-10)',
  '#cccccc': 'var(--gray-20)',
  '#b2b2b2': 'var(--gray-30)',
  '#999999': 'var(--gray-40)',
  '#808080': 'var(--gray-50)',
  '#666666': 'var(--gray-60)',
  '#4c4c4c': 'var(--gray-70)',
  '#333333': 'var(--gray-80)',
  '#1f1f1f': 'var(--gray-88)',
  '#131313': 'var(--gray-93)',
  '#0c0c0c': 'var(--gray-95)',
  '#37a58c': 'var(--green-36)',
  '#3db39a': 'var(--green-35)',
  '#47c0a6': 'var(--green-34)',
  '#dc0505': 'var(--red-54)',
  '#eb0505': 'var(--red-52)',
  '#fa0505': 'var(--red-50)',
  '#ff8c0a': 'var(--orange-50)',
  '#ffaa0a': 'var(--orange-40)',
  '#ffc20a': 'var(--orange-30)',
};

// Map common font families to EDS variables
const EDS_FONT_MAP: Record<string, string> = {
  'Ericsson Hilda': 'var(--font-primary)',
  'Helvetica Neue': 'var(--font-secondary)',
  'Arial': 'var(--font-secondary)',
  'Ericsson Standard Icons': 'var(--font-icons)'
};

// Map common font sizes to EDS variables
const EDS_FONT_SIZE_MAP: Record<number, string> = {
  12: 'var(--text-xs)',
  14: 'var(--text-sm)',
  16: 'var(--text-base)',
  18: 'var(--text-lg)',
  20: 'var(--text-xl)',
  24: 'var(--text-2xl)',
  30: 'var(--text-3xl)',
  36: 'var(--text-4xl)',
  48: 'var(--text-5xl)',
  60: 'var(--text-6xl)'
};

// Map common spacing values to EDS variables
const EDS_SPACING_MAP: Record<number, string> = {
  0: 'var(--space-none)',
  2: 'var(--space-xs-2)',
  4: 'var(--space-xs)',
  8: 'var(--space-sm)',
  12: 'var(--space-sm-2)',
  16: 'var(--space-base)',
  20: 'var(--space-base-2)',
  24: 'var(--space-md)',
  32: 'var(--space-lg)',
  40: 'var(--space-lg-2)',
  48: 'var(--space-xl)',
  64: 'var(--space-xl-2)',
  80: 'var(--space-xxl)',
  96: 'var(--space-xxl-2)',
  128: 'var(--space-xxxl)'
};

export class StyleExtractionAgent implements IAgent {
  private onProgress?: (progress: number) => void;
  
  constructor(onProgress?: (progress: number) => void) {
    this.onProgress = onProgress;
  }
  
  async execute(inputs: any[]): Promise<ExtractedStyles> {
    try {
      if (!inputs[0] || !inputs[1]) {
        throw new Error('Missing required inputs');
      }
      
      const designInput = inputs[0] as DesignInputResult;
      const componentResult = inputs[1] as ComponentRecognitionResult;
      
      this.updateProgress(10);
      
      // Extract colors
      const colors = this.extractColors(designInput, componentResult);
      this.updateProgress(40);
      
      // Extract typography
      const typography = this.extractTypography(designInput, componentResult);
      this.updateProgress(60);
      
      // Extract spacing
      const spacing = this.extractSpacing(designInput, componentResult);
      this.updateProgress(80);
      
      // Extract shadows
      const shadows = this.extractShadows(designInput, componentResult);
      this.updateProgress(90);
      
      // Extract breakpoints
      const breakpoints = this.extractBreakpoints();
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
    componentResult: ComponentRecognitionResult
  ): Array<{ name: string; value: string; edsVariable: string }> {
    const colorStyles = designInput.styles ? Object.values(designInput.styles).filter(style => (style as any).styleType === 'FILL') : [];
    const colorSet = new Set<string>();
    const resultColors: Array<{ name: string; value: string; edsVariable: string }> = [];
    
    // Extract colors from style definitions
    colorStyles.forEach(style => {
      if ((style as any).style && (style as any).style.fills && (style as any).style.fills.length > 0) {
        const fill = (style as any).style.fills[0];
        if (fill.type === 'SOLID') {
          const { r, g, b, a = 1 } = fill.color;
          const hex = this.rgbaToHex(r, g, b, a);
          if (!colorSet.has(hex)) {
            colorSet.add(hex);
            resultColors.push({
              name: (style as any).name || `color_${resultColors.length + 1}`,
              value: hex,
              edsVariable: this.mapToEDSColorVariable(hex)
            });
          }
        }
      }
    });
    
    // Extract colors from components
    componentResult.components.forEach(component => {
      if (component.styles && component.styles.colors) {
        component.styles.colors.forEach(color => {
          // Convert rgba to hex
          const hex = this.rgbaToHex(
            parseInt(color.substring(5, color.indexOf(','))) / 255,
            parseInt(color.substring(color.indexOf(',') + 1, color.indexOf(',', color.indexOf(',') + 1))) / 255,
            parseInt(color.substring(color.indexOf(',', color.indexOf(',') + 1) + 1, color.indexOf(',', color.indexOf(',', color.indexOf(',') + 1) + 1))) / 255,
            parseFloat(color.substring(color.lastIndexOf(',') + 1, color.indexOf(')')))
          );
          
          if (!colorSet.has(hex)) {
            colorSet.add(hex);
            resultColors.push({
              name: `color_${resultColors.length + 1}`,
              value: hex,
              edsVariable: this.mapToEDSColorVariable(hex)
            });
          }
        });
      }
    });
    
    return resultColors;
  }
  
  private extractTypography(
    designInput: DesignInputResult,
    componentResult: ComponentRecognitionResult
  ): Array<{ 
    name: string; 
    fontFamily: string; 
    fontSize: string; 
    fontWeight: string | number; 
    lineHeight: string;
    edsVariable: string;
  }> {
    const textStyles = designInput.styles ? Object.values(designInput.styles).filter(style => (style as any).styleType === 'TEXT') : [];
    const resultTypography: Array<{ 
      name: string; 
      fontFamily: string; 
      fontSize: string; 
      fontWeight: string | number; 
      lineHeight: string;
      edsVariable: string;
    }> = [];
    
    // Extract typography from style definitions
    textStyles.forEach(style => {
      if ((style as any).style) {
        const { fontFamily, fontSize, fontWeight, lineHeightPercent, lineHeightPx } = (style as any).style;
        const lineHeight = lineHeightPercent 
          ? `${lineHeightPercent}%` 
          : lineHeightPx 
          ? `${lineHeightPx}px` 
          : 'normal';
        
        resultTypography.push({
          name: (style as any).name || `typography_${resultTypography.length + 1}`,
          fontFamily: fontFamily || 'Ericsson Hilda',
          fontSize: `${fontSize}px`,
          fontWeight: fontWeight || 'normal',
          lineHeight,
          edsVariable: this.mapToEDSTypographyVariable(fontFamily, fontSize, fontWeight)
        });
      }
    });
    
    // Extract typography from components
    componentResult.components.forEach(component => {
      if (component.type === 'TEXT' && component.properties) {
        const { fontFamily, fontSize, fontWeight, lineHeight } = component.properties;
        
        if (fontFamily && fontSize) {
          resultTypography.push({
            name: `typography_${component.name}`,
            fontFamily: fontFamily,
            fontSize: `${fontSize}px`,
            fontWeight: fontWeight || 'normal',
            lineHeight: lineHeight || 'normal',
            edsVariable: this.mapToEDSTypographyVariable(fontFamily, fontSize, fontWeight)
          });
        }
      }
    });
    
    return resultTypography;
  }
  
  private extractSpacing(
    designInput: DesignInputResult,
    componentResult: ComponentRecognitionResult
  ): Array<{ name: string; value: string; edsVariable: string }> {
    const resultSpacing: Array<{ name: string; value: string; edsVariable: string }> = [];
    const spacingSet = new Set<number>();
    
    // Add default EDS spacing values
    [0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128].forEach(value => {
      resultSpacing.push({
        name: `space_${value}`,
        value: `${value}px`,
        edsVariable: this.mapToEDSSpacingVariable(value)
      });
      spacingSet.add(value);
    });
    
    // Extract spacing from layouts
    componentResult.layouts.forEach(layout => {
      if (layout.properties) {
        // Extract gaps
        if (layout.properties.gap && typeof layout.properties.gap === 'number') {
          const gap = layout.properties.gap;
          if (!spacingSet.has(gap)) {
            spacingSet.add(gap);
            resultSpacing.push({
              name: `space_${gap}`,
              value: `${gap}px`,
              edsVariable: this.mapToEDSSpacingVariable(gap)
            });
          }
        }
        
        // Extract padding if specified
        if (layout.properties.padding && typeof layout.properties.padding === 'string') {
          const paddingValues = layout.properties.padding.split(' ').map((v: string) => parseInt(v));
          paddingValues.forEach((padding: number) => {
            if (!spacingSet.has(padding)) {
              spacingSet.add(padding);
              resultSpacing.push({
                name: `space_${padding}`,
                value: `${padding}px`,
                edsVariable: this.mapToEDSSpacingVariable(padding)
              });
            }
          });
        }
      }
    });
    
    return resultSpacing;
  }
  
  private extractShadows(
    designInput: DesignInputResult,
    componentResult: ComponentRecognitionResult
  ): Array<{ name: string; value: string; edsVariable: string }> {
    const resultShadows: Array<{ name: string; value: string; edsVariable: string }> = [];
    
    // Default EDS shadows
    resultShadows.push({
      name: 'shadow_sm',
      value: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      edsVariable: 'var(--shadow-sm)'
    });
    
    resultShadows.push({
      name: 'shadow_md',
      value: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      edsVariable: 'var(--shadow-md)'
    });
    
    resultShadows.push({
      name: 'shadow_lg',
      value: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      edsVariable: 'var(--shadow-lg)'
    });
    
    resultShadows.push({
      name: 'shadow_xl',
      value: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      edsVariable: 'var(--shadow-xl)'
    });
    
    resultShadows.push({
      name: 'shadow_2xl',
      value: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      edsVariable: 'var(--shadow-2xl)'
    });
    
    // Extract effects from components that might have shadows
    componentResult.components.forEach(component => {
      if (component.type === 'RECTANGLE' || component.type === 'FRAME') {
        // TODO: Extract shadow effects from figma components
        // This would require additional data from the Figma API
      }
    });
    
    return resultShadows;
  }
  
  private extractBreakpoints(): Array<{ name: string; value: string; edsVariable: string }> {
    // EDS standard breakpoints
    return [
      {
        name: 'breakpoint_sm',
        value: '640px',
        edsVariable: 'var(--breakpoint-sm)'
      },
      {
        name: 'breakpoint_md',
        value: '768px',
        edsVariable: 'var(--breakpoint-md)'
      },
      {
        name: 'breakpoint_lg',
        value: '1024px',
        edsVariable: 'var(--breakpoint-lg)'
      },
      {
        name: 'breakpoint_xl',
        value: '1280px',
        edsVariable: 'var(--breakpoint-xl)'
      },
      {
        name: 'breakpoint_2xl',
        value: '1536px',
        edsVariable: 'var(--breakpoint-2xl)'
      }
    ];
  }
  
  // Helper methods
  private rgbaToHex(r: number, g: number, b: number, a: number = 1): string {
    const toHex = (c: number) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    return hex.toLowerCase();
  }
  
  private mapToEDSColorVariable(hexColor: string): string {
    // Try to match the hexColor to a known EDS variable
    return EDS_COLOR_MAP[hexColor.toLowerCase()] || hexColor;
  }
  
  private mapToEDSTypographyVariable(fontFamily: string, fontSize: number, fontWeight: string | number): string {
    // Font family mapping
    const family = EDS_FONT_MAP[fontFamily] || 'var(--font-primary)';
    
    // Font size mapping
    const size = EDS_FONT_SIZE_MAP[fontSize] || `var(--text-base)`;
    
    return `${family} ${size}`;
  }
  
  private mapToEDSSpacingVariable(spacing: number): string {
    return EDS_SPACING_MAP[spacing] || `${spacing}px`;
  }
}