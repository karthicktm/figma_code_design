import { ValidationIssue } from '../../types/validation.types';
import { Logger } from '../../config/logger';
import { Linter } from '../../lib/code-analysis/linter';
import { Parser } from '../../lib/code-analysis/parser';

export class SyntaxValidator {
  private linter: Linter;
  private parser: Parser;
  private severityThresholds: Record<string, number>;
  
  constructor() {
    this.linter = new Linter();
    this.parser = new Parser();
    
    // Configure severity thresholds for different types of issues
    this.severityThresholds = {
      'missing-import': 'error',
      'unused-import': 'warning',
      'syntax-error': 'error',
      'undefined-variable': 'error',
      'unused-variable': 'warning',
      'missing-props': 'error',
      'type-error': 'error',
      'accessibility-issue': 'warning'
    };
    
    Logger.info('SyntaxValidator initialized');
  }
  
  /**
   * Validate code for syntax issues
   */
  public async validate(
    files: Record<string, string>,
    options: any
  ): Promise<ValidationIssue[]> {
    Logger.info('Validating code syntax...');
    
    const issues: ValidationIssue[] = [];
    
    for (const [filename, content] of Object.entries(files)) {
      try {
        // Parse the file to check for syntax errors
        const parseResult = await this.parser.parse(content, {
          filename,
          language: this.getLanguageFromFilename(filename),
          ...options
        });
        
        if (parseResult.errors.length > 0) {
          // Add syntax errors
          for (const error of parseResult.errors) {
            issues.push({
              id: `syntax-${filename}-${error.line || 0}-${error.column || 0}`,
              type: 'syntax-error',
              severity: 'error',
              message: error.message,
              file: filename,
              line: error.line,
              column: error.column,
              code: error.code,
              suggestion: error.suggestion
            });
          }
        } else {
          // If syntax is valid, run the linter
          const lintResult = await this.linter.lint(content, {
            filename,
            language: this.getLanguageFromFilename(filename),
            ...options
          });
          
          // Add lint issues
          for (const issue of lintResult.issues) {
            const severity = this.determineSeverity(issue.type);
            
            issues.push({
              id: `lint-${filename}-${issue.line || 0}-${issue.column || 0}-${issue.type}`,
              type: issue.type,
              severity,
              message: issue.message,
              file: filename,
              line: issue.line,
              column: issue.column,
              code: issue.code,
              suggestion: issue.fix || issue.suggestion
            });
          }
        }
      } catch (error) {
        Logger.error(`Error validating syntax for ${filename}:`, error);
        
        // Add a general error for the file
        issues.push({
          id: `error-${filename}`,
          type: 'validation-error',
          severity: 'error',
          message: `Error validating file: ${error instanceof Error ? error.message : String(error)}`,
          file: filename
        });
      }
    }
    
    Logger.info(`Found ${issues.length} syntax issues`);
    return issues;
  }
  
  /**
   * Determine the severity level for an issue type
   */
  private determineSeverity(issueType: string): 'error' | 'warning' | 'info' {
    // Check if we have a configured severity for this issue type
    const configuredSeverity = this.severityThresholds[issueType];
    
    if (configuredSeverity) {
      return configuredSeverity as 'error' | 'warning' | 'info';
    }
    
    // Default severity levels based on issue type patterns
    if (issueType.includes('error')) {
      return 'error';
    } else if (issueType.includes('warning')) {
      return 'warning';
    } else {
      return 'info';
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
    
    Logger.info(`SyntaxValidator learning from ${errors.length} errors`);
    
    // Analyze common error types to adjust severity thresholds
    const errorTypeCounts: Record<string, number> = {};
    
    for (const error of errors) {
      const message = error.data?.error || '';
      
      // Extract error types from error messages
      const types = [
        'missing-import',
        'unused-import',
        'syntax-error',
        'undefined-variable',
        'unused-variable',
        'missing-props',
        'type-error',
        'accessibility-issue'
      ];
      
      for (const type of types) {
        if (message.includes(type) || message.toLowerCase().includes(type.replace(/-/g, ' '))) {
          errorTypeCounts[type] = (errorTypeCounts[type] || 0) + 1;
        }
      }
    }
    
    // Adjust severity thresholds based on frequency
    for (const [type, count] of Object.entries(errorTypeCounts)) {
      if (count >= 3 && this.severityThresholds[type] === 'warning') {
        // Upgrade warnings to errors if they occur frequently
        this.severityThresholds[type] = 'error';
        Logger.info(`Upgraded severity of ${type} from warning to error`);
      } else if (count >= 5 && this.severityThresholds[type] === 'info') {
        // Upgrade info to warnings if they occur very frequently
        this.severityThresholds[type] = 'warning';
        Logger.info(`Upgraded severity of ${type} from info to warning`);
      }
    }
  }
}
 
