import { ValidationIssue } from '../../types/validation.types';
import { Logger } from '../../config/logger';
import { Linter } from '../../lib/code-analysis/linter';

export class StyleValidator {
  private linter: Linter;
  private styleRules: Record<string, any>;
  
  constructor() {
    this.linter = new Linter();
    
    // Configure style rules
    this.styleRules = {
      'indentation': {
        enabled: true,
        spaces: 2
      },
      'max-line-length': {
        enabled: true,
        length: 100
      },
      'naming-convention': {
        enabled: true,
        conventions: {
          components: 'PascalCase',
          functions: 'camelCase',
          variables: 'camelCase',
          constants: 'UPPER_CASE'
        }
      },
      'consistent-return': {
        enabled: true
      },
      'no-console': {
        enabled: true,
        severity: 'warning'
      }
    };
    
    Logger.info('StyleValidator initialized');
  }
  
  /**
   * Validate code for style issues
   */
  public async validate(
    files: Record<string, string>,
    options: any
  ): Promise<ValidationIssue[]> {
    Logger.info('Validating code style...');
    
    const issues: ValidationIssue[] = [];
    
    for (const [filename, content] of Object.entries(files)) {
      try {
        // Run the linter with style rules
        const lintResult = await this.linter.lint(content, {
          filename,
          language: this.getLanguageFromFilename(filename),
          rules: this.styleRules,
          ...options
        });
        
        // Add style issues
        for (const issue of lintResult.issues) {
          issues.push({
            id: `style-${filename}-${issue.line || 0}-${issue.column || 0}-${issue.type}`,
            type: issue.type,
            severity: issue.severity || 'warning',
            message: issue.message,
            file: filename,
            line: issue.line,
            column: issue.column,
            code: issue.code,
            suggestion: issue.fix || issue.suggestion
          });
        }
        
        // Add additional style checks
        const additionalIssues = this.runAdditionalStyleChecks(filename, content, options);
        issues.push(...additionalIssues);
      } catch (error) {
        Logger.error(`Error validating style for ${filename}:`, error);
        
        // Add a general error for the file
        issues.push({
          id: `error-${filename}`,
          type: 'style-validation-error',
          severity: 'warning',
          message: `Error validating style: ${error instanceof Error ? error.message : String(error)}`,
          file: filename
        });
      }
    }
    
    Logger.info(`Found ${issues.length} style issues`);
    return issues;
  }
  
  /**
   * Run additional style checks beyond what the linter provides
   */
  private runAdditionalStyleChecks(
    filename: string,
    content: string,
    options: any
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    // Check for excessive blank lines
    const blankLineMatches = content.match(/\n\s*\n\s*\n/g);
    if (blankLineMatches && blankLineMatches.length > 0) {
      issues.push({
        id: `style-${filename}-blank-lines`,
        type: 'excessive-blank-lines',
        severity: 'info',
        message: 'Excessive blank lines detected',
        file: filename,
        suggestion: 'Reduce consecutive blank lines to a maximum of one'
      });
    }
    
    // Check for inconsistent quote styles
    const singleQuotes = (content.match(/'/g) || []).length;
    const doubleQuotes = (content.match(/"/g) || []).length;
    
    if (singleQuotes > 0 && doubleQuotes > 0) {
      // If there's a mix of quote styles and one is clearly dominant
      const dominantStyle = singleQuotes > doubleQuotes * 3 ? 'single' : doubleQuotes > singleQuotes * 3 ? 'double' : null;
      
      if (dominantStyle) {
        issues.push({
          id: `style-${filename}-quotes`,
          type: 'inconsistent-quotes',
          severity: 'info',
          message: `Mixed quote styles with predominantly ${dominantStyle} quotes`,
          file: filename,
          suggestion: `Consider using ${dominantStyle} quotes consistently throughout the file`
        });
      }
    }
    
    // Framework-specific checks
    if (options.framework === 'react') {
      // Check for React style issues
      this.checkReactStyleIssues(filename, content, issues);
    } else if (options.framework === 'vue') {
      // Check for Vue style issues
      this.checkVueStyleIssues(filename, content, issues);
    }
    
    return issues;
  }
  
  /**
   * Check for React-specific style issues
   */
  private checkReactStyleIssues(
    filename: string,
    content: string,
    issues: ValidationIssue[]
  ): void {
    // Check for inline styles (should use styled-components or className)
    const inlineStyleMatches = content.match(/style={{.*?}}/g);
    if (inlineStyleMatches && inlineStyleMatches.length > 2) {
      issues.push({
        id: `style-${filename}-inline-styles`,
        type: 'excessive-inline-styles',
        severity: 'warning',
        message: 'Excessive use of inline styles',
        file: filename,
        suggestion: 'Consider using styled-components, CSS modules, or className with external styles'
      });
    }
    
    // Check for missing React key prop in lists
    if (content.includes('map(') && !content.includes('key=')) {
      issues.push({
        id: `style-${filename}-missing-key`,
        type: 'missing-key-prop',
        severity: 'warning',
        message: 'Possible missing key prop in list rendering',
        file: filename,
        suggestion: 'Add a unique "key" prop to elements inside map() functions'
      });
    }
  }
  
  /**
   * Check for Vue-specific style issues
   */
  private checkVueStyleIssues(
    filename: string,
    content: string,
    issues: ValidationIssue[]
  ): void {
    // Check for inline styles (should use :class or <style>)
    const inlineStyleMatches = content.match(/:style="{.*?}"/g);
    if (inlineStyleMatches && inlineStyleMatches.length > 2) {
      issues.push({
        id: `style-${filename}-inline-styles`,
        type: 'excessive-inline-styles',
        severity: 'warning',
        message: 'Excessive use of inline styles',
        file: filename,
        suggestion: 'Consider using :class with external styles or the <style> section'
      });
    }
    
    // Check for v-for without v-bind:key
    if (content.includes('v-for=') && !content.includes(':key=')) {
      issues.push({
        id: `style-${filename}-missing-key`,
        type: 'missing-key-binding',
        severity: 'warning',
        message: 'v-for directive without v-bind:key',
        file: filename,
        suggestion: 'Add a unique ":key" binding to elements with v-for'
      });
    }
  }
  
  /**
   * Get the language from a filename based on extension
   */
  private getLanguageFromFilename(filename: string): string {
    if (filename.endsWith('.ts') || filename.endsWith('.tsx')) {
      return 'typescript';
    } else if (filename.endsWith('.js') || filename.endsWith('.jsx')) {
      return 'javascript';
    } else if (filename.endsWith('.vue')) {
      return 'vue';
    } else if (filename.endsWith('.html')) {
      return 'html';
    } else if (filename.endsWith('.css')) {
      return 'css';
    } else if (filename.endsWith('.scss')) {
      return 'scss';
    } else {
      return 'unknown';
    }
  }
  
  /**
   * Learn from past errors to improve validation
   */
  public async learnFromErrors(errors: any[]): Promise<void> {
    if (errors.length === 0) return;
    
    Logger.info(`StyleValidator learning from ${errors.length} errors`);
    
    // Analyze error patterns
    const errorPatterns: Record<string, number> = {};
    
    for (const error of errors) {
      const message = error.data?.error || '';
      
      // Look for style-related keywords
      const styleKeywords = [
        'indentation', 'spacing', 'formatting', 'whitespace',
        'naming', 'convention', 'camelCase', 'PascalCase',
        'line length', 'max-line-length', 'quotes', 'semicolon'
      ];
      
      for (const keyword of styleKeywords) {
        if (message.toLowerCase().includes(keyword.toLowerCase())) {
          errorPatterns[keyword] = (errorPatterns[keyword] || 0) + 1;
        }
      }
    }
    
    // Update rules based on frequent issues
    for (const [keyword, count] of Object.entries(errorPatterns)) {
      if (count >= 3) {
        this.updateRuleBasedOnKeyword(keyword);
      }
    }
  }
  
  /**
   * Update rules based on error keywords
   */
  private updateRuleBasedOnKeyword(keyword: string): void {
    switch (keyword.toLowerCase()) {
      case 'indentation':
      case 'spacing':
      case 'whitespace':
        this.styleRules['indentation'].enabled = true;
        Logger.info('Enhanced indentation rule');
        break;
        
      case 'line length':
      case 'max-line-length':
        // Make line length rule more lenient
        this.styleRules['max-line-length'].length += 20;
        Logger.info(`Adjusted max line length to ${this.styleRules['max-line-length'].length}`);
        break;
        
      case 'naming':
      case 'convention':
      case 'camelcase':
      case 'pascalcase':
        this.styleRules['naming-convention'].enabled = true;
        Logger.info('Enhanced naming convention rule');
        break;
        
      case 'quotes':
        // Add quotes rule if it doesn't exist
        if (!this.styleRules['quotes']) {
          this.styleRules['quotes'] = {
            enabled: true,
            style: 'single' // Default to single quotes
          };
          Logger.info('Added quotes style rule');
        }
        break;
        
      case 'semicolon':
        // Add semicolon rule if it doesn't exist
        if (!this.styleRules['semicolons']) {
          this.styleRules['semicolons'] = {
            enabled: true,
            style: 'always' // Default to always using semicolons
          };
          Logger.info('Added semicolons rule');
        }
        break;
    }
  }
} 
