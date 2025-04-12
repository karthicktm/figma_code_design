import { Logger } from '../../config/logger';
import { StyleIssue } from '../../types/figma.types';

interface StyleRule {
  id: string;
  name: string;
  description: string;
  validate: (styles: Record<string, any>) => StyleIssue[];
}

export class StyleValidator {
  private rules: StyleRule[];
  
  constructor() {
    this.rules = [];
    
    // Initialize built-in validation rules
    this.initializeRules();
    
    Logger.info('StyleValidator initialized with', this.rules.length, 'rules');
  }
  
  /**
   * Initialize built-in style validation rules
   */
  private initializeRules(): void {
    // Color consistency rule
    this.rules.push({
      id: 'color-consistency',
      name: 'Color Consistency',
      description: 'Check for similar but different colors that might be inconsistent',
      validate: (styles) => {
        const issues: StyleIssue[] = [];
        const colors = styles.colors || {};
        
        const colorValues = Object.values(colors).map(color => ({
          hex: (color as any).hex,
          name: (color as any).name
        }));
        
        // Find similar colors
        for (let i = 0; i < colorValues.length; i++) {
          for (let j = i + 1; j < colorValues.length; j++) {
            const color1 = colorValues[i];
            const color2 = colorValues[j];
            
            if (this.areColorsSimilar(color1.hex, color2.hex)) {
              issues.push({
                type: 'color-variants',
                severity: 'warning',
                message: `Similar colors detected: "${color1.name}" and "${color2.name}"`,
                affectedItems: [color1.hex, color2.hex],
                suggestion: 'Consider consolidating similar colors to improve consistency'
              });
            }
          }
        }
        
        return issues;
      }
    });
    
    // Text style consistency rule
    this.rules.push({
      id: 'text-style-consistency',
      name: 'Text Style Consistency',
      description: 'Check for non-standard font sizes and inconsistent text styles',
      validate: (styles) => {
        const issues: StyleIssue[] = [];
        const textStyles = styles.textStyles || {};
        
        // Extract font sizes and count occurrences
        const fontSizeCounts: Record<number, number> = {};
        const fontSizes: number[] = [];
        
        Object.values(textStyles).forEach(style => {
          const fontSize = (style as any).fontSize;
          if (fontSize) {
            fontSizeCounts[fontSize] = (fontSizeCounts[fontSize] || 0) + 1;
            if (!fontSizes.includes(fontSize)) {
              fontSizes.push(fontSize);
            }
          }
        });
        const nonStandardFontSizes = Object.entries(fontSizeCounts)
        .filter(([_, count]) => count <= 2)
        .map(([size, _]) => parseFloat(size));
      
      if (nonStandardFontSizes.length > 0) {
        issues.push({
          type: 'inconsistent-text-styles',
          severity: 'warning',
          message: `${nonStandardFontSizes.length} non-standard font sizes detected`,
          affectedItems: nonStandardFontSizes.map(size => `${size}px`),
          suggestion: 'Consider using standard font sizes across the design'
        });
      }
      
      // Check if there are too many different font sizes
      if (fontSizes.length > 8) {
        issues.push({
          type: 'too-many-font-sizes',
          severity: 'info',
          message: `Large number of different font sizes (${fontSizes.length})`,
          affectedItems: fontSizes.map(size => `${size}px`),
          suggestion: 'Consider reducing the number of different font sizes for better consistency'
        });
      }
      
      return issues;
    }
  });
  
  // Effect consistency rule
  this.rules.push({
    id: 'effect-consistency',
    name: 'Effect Consistency',
    description: 'Check for inconsistent shadow effects',
    validate: (styles) => {
      const issues: StyleIssue[] = [];
      const effects = styles.effects || {};
      
      // Extract shadow properties
      const shadowEffects = Object.values(effects)
        .filter(effect => (effect as any).type === 'drop-shadow' || (effect as any).type === 'inner-shadow');
      
      // Check for similar but different shadows
      for (let i = 0; i < shadowEffects.length; i++) {
        for (let j = i + 1; j < shadowEffects.length; j++) {
          const effect1 = shadowEffects[i] as any;
          const effect2 = shadowEffects[j] as any;
          
          // Skip if they're different types of shadows
          if (effect1.type !== effect2.type) continue;
          
          // Check if shadows are similar but not identical
          if (this.areShadowsSimilar(effect1, effect2)) {
            issues.push({
              type: 'shadow-variants',
              severity: 'info',
              message: `Similar ${effect1.type} effects detected: "${effect1.name}" and "${effect2.name}"`,
              affectedItems: [effect1.name, effect2.name],
              suggestion: 'Consider consolidating similar shadow effects'
            });
          }
        }
      }
      
      return issues;
    }
  });
  
  // Color contrast rule
  this.rules.push({
    id: 'color-contrast',
    name: 'Color Contrast',
    description: 'Check if text color has sufficient contrast with background colors',
    validate: (styles) => {
      // In a real implementation, we would analyze actual text/background color pairs
      // This is a simplified placeholder
      return [];
    }
  });
}

/**
 * Validate styles against rules
 */
public async validateStyles(styles: Record<string, any>): Promise<StyleIssue[]> {
  Logger.info('Validating styles...');
  
  const allIssues: StyleIssue[] = [];
  
  for (const rule of this.rules) {
    try {
      const issues = rule.validate(styles);
      allIssues.push(...issues);
    } catch (error) {
      Logger.error(`Error validating rule ${rule.name}:`, error);
    }
  }
  
  Logger.info(`Found ${allIssues.length} style issues`);
  return allIssues;
}

/**
 * Check if two colors are similar but not identical
 */
private areColorsSimilar(hex1: string, hex2: string): boolean {
  if (hex1 === hex2) return false; // Same color, not a consistency issue
  
  // Convert hex to RGB
  const rgb1 = this.hexToRgb(hex1);
  const rgb2 = this.hexToRgb(hex2);
  
  if (!rgb1 || !rgb2) return false;
  
  // Calculate color distance using Euclidean distance in RGB space
  const distance = Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
    Math.pow(rgb1.g - rgb2.g, 2) +
    Math.pow(rgb1.b - rgb2.b, 2)
  );
  
  // Colors are similar if distance is small but not zero
  return distance > 0 && distance < 25; // Threshold can be adjusted
}

/**
 * Convert hex color to RGB
 */
private hexToRgb(hex: string): { r: number, g: number, b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null;
}

/**
 * Check if two shadow effects are similar but not identical
 */
private areShadowsSimilar(shadow1: any, shadow2: any): boolean {
  if (!shadow1.radius || !shadow2.radius) return false;
  
  // Check if radius is similar
  const radiusDiff = Math.abs(shadow1.radius - shadow2.radius);
  
  // Check if offset is similar
  const offsetXDiff = Math.abs((shadow1.offset?.x || 0) - (shadow2.offset?.x || 0));
  const offsetYDiff = Math.abs((shadow1.offset?.y || 0) - (shadow2.offset?.y || 0));
  
  // Check if color is similar (if available)
  let colorSimilar = true;
  if (shadow1.color && shadow2.color) {
    colorSimilar = this.areColorsSimilar(shadow1.color, shadow2.color);
  }
  
  // Shadows are similar if all properties are close but not identical
  return radiusDiff > 0 && radiusDiff < 3 && // Small difference in radius
         offsetXDiff < 2 && offsetYDiff < 2 && // Small difference in offset
         colorSimilar; // Similar color
}

/**
 * Learn from past errors to improve validation
 */
public async learnFromErrors(errors: any[]): Promise<void> {
  Logger.info(`Learning from ${errors.length} style validation errors`);
  
  // Analyze error patterns
  let addColorContrastRule = false;
  let relaxTextStyleRule = false;
  
  for (const error of errors) {
    const errorMsg = error.data?.error || '';
    
    if (errorMsg.includes('color contrast') || errorMsg.includes('accessibility')) {
      addColorContrastRule = true;
    }
    
    if (errorMsg.includes('text style') || errorMsg.includes('font size')) {
      relaxTextStyleRule = true;
    }
  }
  
  // Apply learnings
  if (addColorContrastRule) {
    const hasContrastRule = this.rules.some(rule => rule.id === 'color-contrast');
    
    if (!hasContrastRule) {
      this.rules.push({
        id: 'color-contrast',
        name: 'Color Contrast',
        description: 'Check if text color has sufficient contrast with background colors',
        validate: (styles) => {
          // Implement a more robust color contrast check
          const issues: StyleIssue[] = [];
          // ... implementation would go here in a full system
          return issues;
        }
      });
      
      Logger.info('Added color contrast rule based on learning');
    }
  }
  
  if (relaxTextStyleRule) {
    // Find the text style rule and modify its threshold
    const textStyleRule = this.rules.find(rule => rule.id === 'text-style-consistency');
    
    if (textStyleRule) {
      const originalValidate = textStyleRule.validate;
      
      // Create a modified validate function with relaxed thresholds
      textStyleRule.validate = (styles) => {
        const issues = originalValidate(styles);
        
        // Filter out less important issues
        return issues.filter(issue => 
          issue.type !== 'too-many-font-sizes' || 
          issue.affectedItems.length > 10 // Only report if there are more than 10 font sizes
        );
      };
      
      Logger.info('Relaxed text style consistency rule based on learning');
    }
  }
}
}

