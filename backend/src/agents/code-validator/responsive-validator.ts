import { ValidationIssue } from '../../types/validation.types';
import { Logger } from '../../config/logger';

export class ResponsiveValidator {
  private viewportSizes: { name: string; width: number; height: number }[];
  private frameworkChecks: Record<string, (content: string) => ValidationIssue[]>;
  
  constructor() {
    // Define standard viewport sizes for testing
    this.viewportSizes = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1440, height: 900 }
    ];
        // Define framework-specific responsive checks
    this.frameworkChecks = {
      'react': this.checkReactResponsiveness,
      'vue': this.checkVueResponsiveness,
      'angular': this.checkAngularResponsiveness,
      'html': this.checkHtmlResponsiveness
    };
    
    Logger.info('ResponsiveValidator initialized');
  }
  
  /**
   * Validate code for responsiveness issues
   */
  public async validate(
    files: Record<string, string>,
    options: any
  ): Promise<ValidationIssue[]> {
    Logger.info('Validating code responsiveness...');
    
    const issues: ValidationIssue[] = [];
    
    // Group files by type
    const cssFiles: Record<string, string> = {};
    const componentFiles: Record<string, string> = {};
    
    for (const [filename, content] of Object.entries(files)) {
      if (filename.endsWith('.css') || filename.endsWith('.scss')) {
        cssFiles[filename] = content;
      } else {
        componentFiles[filename] = content;
      }
    }
    
    // Check CSS files for responsive features
    const cssIssues = await this.checkCssResponsiveness(cssFiles);
    issues.push(...cssIssues);
    
    // Check component files based on framework
    const framework = options.framework || 'react';
    
    for (const [filename, content] of Object.entries(componentFiles)) {
      try {
        // Run framework-specific checks
        const checkFunction = this.frameworkChecks[framework];
        
        if (checkFunction) {
          const componentIssues = checkFunction.call(this, content);
          
          // Add filename to each issue
          componentIssues.forEach(issue => {
            issue.file = filename;
            issues.push(issue);
          });
        }
      } catch (error) {
        Logger.error(`Error validating responsiveness for ${filename}:`, error);
        
        // Add a general error for the file
        issues.push({
          id: `error-${filename}`,
          type: 'responsiveness-validation-error',
          severity: 'warning',
          message: `Error validating responsiveness: ${error instanceof Error ? error.message : String(error)}`,
          file: filename
        });
      }
    }
    
    Logger.info(`Found ${issues.length} responsiveness issues`);
    return issues;
  }
  
  /**
   * Check CSS files for responsive design features
   */
  private async checkCssResponsiveness(
    cssFiles: Record<string, string>
  ): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];
    
    for (const [filename, content] of Object.entries(cssFiles)) {
      // Check for media queries
      const mediaQueryMatches = content.match(/@media/g);
      if (!mediaQueryMatches) {
        issues.push({
          id: `responsive-${filename}-no-media-queries`,
          type: 'missing-media-queries',
          severity: 'warning',
          message: 'No media queries found in CSS',
          file: filename,
          suggestion: 'Add media queries for different screen sizes (e.g., mobile, tablet, desktop)'
        });
      }
      
      // Check for fixed widths (px) versus relative widths (%, vw, em, rem)
      const fixedWidthMatches = content.match(/width:\s*\d+px/g);
      const relativeWidthMatches = content.match(/width:\s*\d+(%|vw|em|rem)/g);
      
      if (fixedWidthMatches && (!relativeWidthMatches || fixedWidthMatches.length > relativeWidthMatches.length * 2)) {
        issues.push({
          id: `responsive-${filename}-fixed-widths`,
          type: 'excessive-fixed-widths',
          severity: 'warning',
          message: 'Excessive use of fixed widths (px) rather than relative units',
          file: filename,
          suggestion: 'Use relative width units (%, vw, em, rem) for better responsiveness'
        });
      }
      
      // Check for fixed heights
      const fixedHeightMatches = content.match(/height:\s*\d+px/g);
      if (fixedHeightMatches && fixedHeightMatches.length > 5) {
        issues.push({
          id: `responsive-${filename}-fixed-heights`,
          type: 'excessive-fixed-heights',
          severity: 'warning',
          message: 'Excessive use of fixed heights',
          file: filename,
          suggestion: 'Avoid fixed heights when possible for better content adaptability'
        });
      }
      
      // Check for flex or grid usage
      const flexMatches = content.match(/display:\s*flex/g);
      const gridMatches = content.match(/display:\s*grid/g);
      
      if (!flexMatches && !gridMatches) {
        issues.push({
          id: `responsive-${filename}-no-modern-layout`,
          type: 'missing-modern-layout',
          severity: 'info',
          message: 'No flexbox or grid layout techniques detected',
          file: filename,
          suggestion: 'Consider using flexbox or CSS grid for responsive layouts'
        });
      }
    }
    
    return issues;
  }
  
  /**
   * Check React components for responsiveness
   */
  private checkReactResponsiveness(content: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    // Check for responsive classes if using Tailwind
    if (content.includes('className=')) {
      const smMatches = content.match(/sm:/g);
      const mdMatches = content.match(/md:/g);
      const lgMatches = content.match(/lg:/g);
      
      if (!smMatches && !mdMatches && !lgMatches) {
        issues.push({
          id: `responsive-tailwind-missing`,
          type: 'missing-responsive-tailwind',
          severity: 'warning',
          message: 'No responsive Tailwind classes detected (sm:, md:, lg:)',
          suggestion: 'Add responsive breakpoint prefixes to Tailwind classes for different screen sizes'
        });
      }
    }
    
    // Check for media queries in styled-components
    if (content.includes('styled') && !content.includes('@media')) {
      issues.push({
        id: `responsive-styled-components-missing`,
        type: 'missing-media-queries-styled',
        severity: 'warning',
        message: 'No media queries found in styled-components',
        suggestion: 'Add @media queries in styled-components for responsive styling'
      });
    }
    
    // Check for fixed dimensions in inline styles
    const inlineStyleMatches = content.match(/style={{[^}]*width:\s*['"]?\d+px['"]?/g);
    if (inlineStyleMatches) {
      issues.push({
        id: `responsive-inline-fixed-widths`,
        type: 'fixed-width-inline-styles',
        severity: 'warning',
        message: 'Fixed width values in inline styles',
        suggestion: 'Avoid fixed width values in inline styles; use relative units or styled components'
      });
    }
    
    return issues;
  }
  
  /**
   * Check Vue components for responsiveness
   */
  private checkVueResponsiveness(content: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    // Check for responsive classes if using Tailwind
    if (content.includes('class=')) {
      const smMatches = content.match(/sm:/g);
      const mdMatches = content.match(/md:/g);
      const lgMatches = content.match(/lg:/g);
      
      if (!smMatches && !mdMatches && !lgMatches) {
        issues.push({
          id: `responsive-tailwind-missing`,
          type: 'missing-responsive-tailwind',
          severity: 'warning',
          message: 'No responsive Tailwind classes detected (sm:, md:, lg:)',
          suggestion: 'Add responsive breakpoint prefixes to Tailwind classes for different screen sizes'
        });
      }
    }
    
    // Check for media queries in style section
    if (content.includes('<style') && !content.includes('@media')) {
      issues.push({
        id: `responsive-vue-style-missing`,
        type: 'missing-media-queries-vue',
        severity: 'warning',
        message: 'No media queries found in Vue component styles',
        suggestion: 'Add @media queries in the <style> section for responsive styling'
      });
    }
    
    // Check for fixed dimensions in inline styles
    const inlineStyleMatches = content.match(/:style="[^"]*width:\s*\d+px/g);
    if (inlineStyleMatches) {
      issues.push({
        id: `responsive-inline-fixed-widths`,
        type: 'fixed-width-inline-styles',
        severity: 'warning',
        message: 'Fixed width values in inline styles',
        suggestion: 'Avoid fixed width values in inline styles; use relative units or CSS classes'
      });
    }
    
    return issues;
  }
  
  /**
   * Check Angular components for responsiveness
   */
  private checkAngularResponsiveness(content: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    // Check for media queries in styles
    if ((content.includes('styles:') || content.includes('styleUrls:')) && !content.includes('@media')) {
      issues.push({
        id: `responsive-angular-style-missing`,
        type: 'missing-media-queries-angular',
        severity: 'warning',
        message: 'No media queries found in Angular component styles',
        suggestion: 'Add @media queries to your component styles for responsive styling'
      });
    }
    
    // Check for ngClass with responsive logic
    if (content.includes('ngClass') && !content.includes('window') && !content.includes('innerWidth')) {
      issues.push({
        id: `responsive-ngclass-missing`,
        type: 'missing-responsive-ngclass',
        severity: 'info',
        message: 'No responsive logic detected in ngClass directives',
        suggestion: 'Consider adding screen size detection to dynamically apply classes via ngClass'
      });
    }
    
    // Check for fixed dimensions in inline styles
    const inlineStyleMatches = content.match(/\[style\.[^]]*width[^\]]*=['"]?\d+px['"]?/g);
    if (inlineStyleMatches) {
      issues.push({
        id: `responsive-inline-fixed-widths`,
        type: 'fixed-width-inline-styles',
        severity: 'warning',
        message: 'Fixed width values in inline styles',
        suggestion: 'Avoid fixed width values in inline styles; use relative units or CSS classes'
      });
    }
    
    return issues;
  }
  
  /**
   * Check HTML/CSS components for responsiveness
   */
  private checkHtmlResponsiveness(content: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    // Check for viewport meta tag
    if (content.includes('<head') && !content.includes('viewport')) {
      issues.push({
        id: `responsive-viewport-missing`,
        type: 'missing-viewport-meta',
        severity: 'error',
        message: 'No viewport meta tag found',
        suggestion: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0"> to the <head> section'
      });
    }
    
    // Check for responsive images
    const imgTags = content.match(/<img[^>]*>/g) || [];
    const responsiveImgCount = imgTags.filter(tag => 
      tag.includes('width="100%"') || 
      tag.includes('max-width') || 
      tag.includes('srcset')
    ).length;
    
    if (imgTags.length > 0 && responsiveImgCount < imgTags.length) {
      issues.push({
        id: `responsive-images-missing`,
        type: 'non-responsive-images',
        severity: 'warning',
        message: 'Non-responsive images detected',
        suggestion: 'Make images responsive using width="100%", max-width, or srcset attributes'
      });
    }
    
    // Check for media queries in style tags
    if (content.includes('<style') && !content.includes('@media')) {
      issues.push({
        id: `responsive-style-missing`,
        type: 'missing-media-queries-html',
        severity: 'warning',
        message: 'No media queries found in style tags',
        suggestion: 'Add @media queries in your <style> tags for responsive styling'
      });
    }
    
    return issues;
  }
  
  /**
   * Learn from past errors to improve validation
   */
  public async learnFromErrors(errors: any[]): Promise<void> {
    if (errors.length === 0) return;
    
    Logger.info(`ResponsiveValidator learning from ${errors.length} errors`);
    
    // Analyze common viewport sizes in errors
    const viewportMentions: Record<string, number> = {};
    
    for (const error of errors) {
      const message = error.data?.error || '';
      
      // Look for mentions of specific screen sizes
      const sizeKeywords = [
        'mobile', 'phone', 'smartphone',
        'tablet', 'ipad',
        'desktop', 'laptop',
        'small screen', 'large screen'
      ];
      
      for (const keyword of sizeKeywords) {
        if (message.toLowerCase().includes(keyword.toLowerCase())) {
          viewportMentions[keyword] = (viewportMentions[keyword] || 0) + 1;
        }
      }
    }
    
    // Add or adjust viewport sizes based on frequency of mentions
    const sizeGroups: Record<string, string[]> = {
      'mobile': ['mobile', 'phone', 'smartphone', 'small screen'],
      'tablet': ['tablet', 'ipad'],
      'desktop': ['desktop', 'laptop', 'large screen']
    };
    
    for (const [group, keywords] of Object.entries(sizeGroups)) {
      const totalMentions = keywords.reduce((sum, keyword) => sum + (viewportMentions[keyword] || 0), 0);
      
      if (totalMentions >= 3) {
        // Adjust existing viewport or add new one
        const existingViewport = this.viewportSizes.find(v => v.name === group);
        
        if (existingViewport) {
          // Just log that we're paying more attention to this size
          Logger.info(`Increased priority for ${group} viewport size`);
        } else {
          // Add a new viewport size
          switch (group) {
            case 'mobile':
              this.viewportSizes.push({ name: 'mobile-small', width: 320, height: 568 });
              Logger.info('Added small mobile viewport size');
              break;
            case 'tablet':
              this.viewportSizes.push({ name: 'tablet-landscape', width: 1024, height: 768 });
              Logger.info('Added landscape tablet viewport size');
              break;
            case 'desktop':
              this.viewportSizes.push({ name: 'desktop-large', width: 1920, height: 1080 });
              Logger.info('Added large desktop viewport size');
              break;
          }
        }
      }
    }
  }
}
