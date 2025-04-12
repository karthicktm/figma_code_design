import { FigmaFile } from '../../types/figma.types';
import { Logger } from '../../config/logger';

export class StyleExtractor {
  private colorFormats: ('hex' | 'rgb' | 'rgba')[];
  
  constructor() {
    this.colorFormats = ['hex', 'rgba']; // Default color formats to extract
    
    Logger.info('StyleExtractor initialized');
  }
  
  /**
   * Extract all styles from a Figma file
   */
  public async extractStyles(figmaFile: FigmaFile): Promise<Record<string, any>> {
    const styles: Record<string, any> = {
      colors: {},
      textStyles: {},
      effects: {}
    };
    
    const document = (figmaFile as any).document;
    
    if (!document) {
      throw new Error('Invalid Figma file: missing document property');
    }
    
    // Extract styles from the document
    if ((figmaFile as any).styles) {
      await this.processStyles((figmaFile as any).styles, styles);
    }
    
    // Extract colors from nodes
    await this.extractColorsFromNodes(document, styles.colors);
    
    // Extract text styles from nodes
    await this.extractTextStylesFromNodes(document, styles.textStyles);
    
    // Extract effect styles from nodes
    await this.extractEffectStylesFromNodes(document, styles.effects);
    
    Logger.info('Extracted styles from Figma file');
    return styles;
  }
  
  /**
   * Process styles defined in the Figma file
   */
  private async processStyles(stylesObj: any, styles: Record<string, any>): Promise<void> {
    for (const styleId in stylesObj) {
      const style = stylesObj[styleId];
      
      switch (style.styleType) {
        case 'FILL':
          styles.colors[styleId] = {
            name: style.name,
            description: style.description,
            type: 'color'
          };
          break;
        case 'TEXT':
          styles.textStyles[styleId] = {
            name: style.name,
            description: style.description,
            type: 'text'
          };
          break;
        case 'EFFECT':
          styles.effects[styleId] = {
            name: style.name,
            description: style.description,
            type: 'effect'
          };
          break;
      }
    }
  }
  
  /**
   * Extract colors from node fills
   */
  private async extractColorsFromNodes(node: any, colors: Record<string, any>): Promise<void> {
    // Process fills if they exist
    if (node.fills && Array.isArray(node.fills)) {
      for (const fill of node.fills) {
        if (fill.type === 'SOLID' && fill.visible !== false) {
          const colorId = `color-${Object.keys(colors).length + 1}`;
          
          colors[colorId] = {
            name: `Color from ${node.name || 'unnamed node'}`,
            type: 'color',
            hex: this.rgbToHex(fill.color),
            rgba: this.rgbToRgba(fill.color, fill.opacity)
          };
        }
      }
    }
    
    // Process children
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        await this.extractColorsFromNodes(child, colors);
      }
    }
  }
  
  /**
   * Extract text styles from text nodes
   */
  private async extractTextStylesFromNodes(node: any, textStyles: Record<string, any>): Promise<void> {
    // Process text style if this is a text node
    if (node.type === 'TEXT' && node.style) {
      const styleId = `text-style-${Object.keys(textStyles).length + 1}`;
      
      textStyles[styleId] = {
        name: `Text style from ${node.name || 'unnamed text'}`,
        fontFamily: node.style.fontFamily,
        fontSize: node.style.fontSize,
        fontWeight: node.style.fontWeight,
        lineHeight: node.style.lineHeight,
        letterSpacing: node.style.letterSpacing,
        textAlign: node.style.textAlignHorizontal,
        textTransform: node.style.textCase === 'UPPER' ? 'uppercase' : 
                      node.style.textCase === 'LOWER' ? 'lowercase' : 
                      node.style.textCase === 'TITLE' ? 'capitalize' : 'none'
      };
    }
    
    // Process children
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        await this.extractTextStylesFromNodes(child, textStyles);
      }
    }
  }
  
  /**
   * Extract effect styles from nodes
   */
  private async extractEffectStylesFromNodes(node: any, effects: Record<string, any>): Promise<void> {
    // Process effects if they exist
    if (node.effects && Array.isArray(node.effects)) {
      for (const effect of node.effects) {
        if (effect.visible !== false) {
          const effectId = `effect-${Object.keys(effects).length + 1}`;
          
          effects[effectId] = {
            name: `Effect from ${node.name || 'unnamed node'}`,
            type: effect.type.toLowerCase(),
            // Add effect-specific properties
            ...(effect.type === 'DROP_SHADOW' && {
              color: this.rgbToRgba(effect.color, effect.opacity),
              offset: { x: effect.offset?.x || 0, y: effect.offset?.y || 0 },
              radius: effect.radius || 0,
              spread: effect.spread || 0
            }),
            ...(effect.type === 'INNER_SHADOW' && {
              color: this.rgbToRgba(effect.color, effect.opacity),
              offset: { x: effect.offset?.x || 0, y: effect.offset?.y || 0 },
              radius: effect.radius || 0,
              spread: effect.spread || 0
            }),
            ...(effect.type === 'LAYER_BLUR' && {
              radius: effect.radius || 0
            }),
            ...(effect.type === 'BACKGROUND_BLUR' && {
              radius: effect.radius || 0
            })
          };
        }
      }
    }
    
    // Process children
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        await this.extractEffectStylesFromNodes(child, effects);
      }
    }
  }
  
  /**
   * Convert RGB color to hex format
   */
  private rgbToHex(color: { r: number; g: number; b: number }): string {
    const toHex = (value: number) => {
      const hex = Math.round(value * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
  }
  
  /**
   * Convert RGB color to RGBA format
   */
  private rgbToRgba(color: { r: number; g: number; b: number }, opacity?: number): string {
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    const a = opacity !== undefined ? opacity : 1;
    
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  
  /**
   * Learn from past errors to improve extraction
   */
  public async learnFromErrors(errors: any[]): Promise<void> {
    let addHexFormat = false;
    let addRgbFormat = false;
    let addRgbaFormat = false;
    
    for (const error of errors) {
      const errorMsg = error.data.error || '';
      
      // Look for patterns in errors
      if (errorMsg.includes('hex color')) {
        addHexFormat = true;
      }
      
      if (errorMsg.includes('rgb')) {
        addRgbFormat = true;
      }
      
      if (errorMsg.includes('rgba') || errorMsg.includes('opacity') || errorMsg.includes('alpha')) {
        addRgbaFormat = true;
      }
    }
    
    // Apply learnings to color formats
    if (addHexFormat && !this.colorFormats.includes('hex')) {
      this.colorFormats.push('hex');
      Logger.info('Added hex to color formats based on learning');
    }
    
    if (addRgbFormat && !this.colorFormats.includes('rgb')) {
      this.colorFormats.push('rgb');
      Logger.info('Added rgb to color formats based on learning');
    }
    
    if (addRgbaFormat && !this.colorFormats.includes('rgba')) {
      this.colorFormats.push('rgba');
      Logger.info('Added rgba to color formats based on learning');
    }
  }
}
