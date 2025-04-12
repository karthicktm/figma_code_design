import { Agent, AgentOptions } from '../base/agent';
import { SyntaxValidator } from './syntax-validator';
import { StyleValidator } from './style-validator';
import { ResponsiveValidator } from './responsive-validator';
import { Logger } from '../../config/logger';
import { CodeValidationRequest, ValidationResult, ValidationIssue } from '../../types/validation.types';

interface CodeValidatorOptions extends AgentOptions {
  syntaxValidator?: SyntaxValidator;
  styleValidator?: StyleValidator;
  responsiveValidator?: ResponsiveValidator;
  weightings?: {
    syntax: number;
    style: number;
    responsive: number;
  };
}

export class CodeValidatorAgent extends Agent {
  private syntaxValidator: SyntaxValidator;
  private styleValidator: StyleValidator;
  private responsiveValidator: ResponsiveValidator;
  private weightings: {
    syntax: number;
    style: number;
    responsive: number;
  };
  
  constructor(options: CodeValidatorOptions) {
    super({
      name: options.name || 'Code Validator Agent',
      description: options.description || 'Validates generated code for syntax, style, and responsiveness',
      capabilities: [
        'code-validation',
        'syntax-checking',
        'style-analysis',
        'responsive-testing',
        ...(options.capabilities || [])
      ],
      maxMemoryItems: options.maxMemoryItems || 50,
      learningRate: options.learningRate || 0.15,
      feedbackThreshold: options.feedbackThreshold || 0.7
    });
    
    this.syntaxValidator = options.syntaxValidator || new SyntaxValidator();
    this.styleValidator = options.styleValidator || new StyleValidator();
    this.responsiveValidator = options.responsiveValidator || new ResponsiveValidator();
    
    // Default weightings for overall score calculation
    this.weightings = options.weightings || {
      syntax: 0.5,  // Syntax is most important
      style: 0.3,   // Style is moderately important
      responsive: 0.2 // Responsiveness is least important (but still matters)
    };
    
    Logger.info('CodeValidatorAgent initialized');
  }
  
  /**
   * Validate generated code
   */
  public async execute<CodeValidationRequest, ValidationResult>(
    request: CodeValidationRequest
  ): Promise<ValidationResult> {
    try {
      this.setState({ status: 'processing', lastExecutionTime: Date.now() });
      
      Logger.info('Validating code...');
      
      const { code, options } = request as unknown as {
        code: Record<string, Record<string, string>>;
        options: {
          framework: string;
          typescript: boolean;
          styling: string;
        };
      };
      
      // Check if we have a cached result for this code
      const cacheKey = this.generateCacheKey(code, options);
      const cachedResult = await this.recall(cacheKey);
      
      if (cachedResult) {
        Logger.info(`Using cached result for code validation`);
        return cachedResult as ValidationResult;
      }
      
      // Flatten the code files for validation
      const files: Record<string, string> = {};
      
      // Process components and layout
      for (const [componentName, componentFiles] of Object.entries(code)) {
        for (const [filename, content] of Object.entries(componentFiles)) {
          files[`${componentName}/${filename}`] = content;
        }
      }
      
      // Run the validation
      const syntaxResults = await this.syntaxValidator.validate(files, options);
      const styleResults = await this.styleValidator.validate(files, options);
      const responsiveResults = await this.responsiveValidator.validate(files, options);
      
      // Calculate scores
      const syntaxScore = this.calculateScore(syntaxResults);
      const styleScore = this.calculateScore(styleResults);
      const responsiveScore = this.calculateScore(responsiveResults);
      
      // Calculate overall score
      const overallScore = 
        (syntaxScore * this.weightings.syntax) +
        (styleScore * this.weightings.style) +
        (responsiveScore * this.weightings.responsive);
      
      // Combine all issues
      const allIssues: ValidationIssue[] = [
        ...syntaxResults,
        ...styleResults,
        ...responsiveResults
      ];
      
      // Prepare the result
      const result = {
        syntaxScore,
        styleScore,
        responsiveScore,
        overallScore,
        issues: allIssues,
        passedValidation: overallScore >= 70 && syntaxScore >= 80,
        metadata: {
          timestamp: Date.now(),
          framework: options.framework,
          totalIssues: allIssues.length,
          criticalIssues: allIssues.filter(issue => issue.severity === 'error').length
        }
      } as unknown as ValidationResult;
      
      // Store the result in memory
      await this.remember(cacheKey, result);
      
      // Process successful execution feedback
      await this.processFeedback({
        success: true,
        data: {
          framework: options.framework,
          scores: {
            syntax: syntaxScore,
            style: styleScore,
            responsive: responsiveScore,
            overall: overallScore
          }
        }
      });
      
      return result;
    } catch (error) {
      Logger.error('Error validating code:', error);
      
      // Process failure feedback
      await this.processFeedback({
        success: false,
        data: {
          error: error instanceof Error ? error.message : String(error),
          request
        }
      });
      
      this.setState({ status: 'error' });
      throw error;
    } finally {
      this.setState({ status: 'idle' });
    }
  }
  
  /**
   * Generate a cache key for a specific validation request
   */
  private generateCacheKey(code: Record<string, Record<string, string>>, options: any): string {
    // Create a hash of the code content
    const codeHash = Object.entries(code)
      .map(([name, files]) => `${name}:${Object.keys(files).length}`)
      .join(',');
    
    return `validation:${options.framework}:${options.styling}:${options.typescript}:${codeHash}`;
  }
  
  /**
   * Calculate a score (0-100) based on validation issues
   */
  private calculateScore(issues: ValidationIssue[]): number {
    if (issues.length === 0) return 100;
    
    // Count issues by severity
    const errorCount = issues.filter(issue => issue.severity === 'error').length;
    const warningCount = issues.filter(issue => issue.severity === 'warning').length;
    const infoCount = issues.filter(issue => issue.severity === 'info').length;
    
    // Calculate penalty for each type of issue
    const errorPenalty = errorCount * 15; // Each error costs 15 points
    const warningPenalty = warningCount * 5; // Each warning costs 5 points
    const infoPenalty = infoCount * 1; // Each info issue costs 1 point
    
    // Calculate total penalty (capped at 100)
    const totalPenalty = Math.min(100, errorPenalty + warningPenalty + infoPenalty);
    
    // Calculate score
    return Math.max(0, 100 - totalPenalty);
  }
  
  /**
   * Learn from past errors to improve validation
   */
  protected async performLearning(feedbackData: any[]): Promise<void> {
    Logger.info(`CodeValidatorAgent learning from ${feedbackData.length} feedback items`);
    
    // Filter to only unsuccessful validations
    const failures = feedbackData.filter(item => !item.success);
    
    if (failures.length === 0) {
      Logger.info('No failures to learn from, skipping learning cycle');
      return;
    }
    
    // Analyze failures to identify patterns
    const errorPatterns = this.analyzeErrorPatterns(failures);
    
    // Update validators based on learning
    await this.syntaxValidator.learnFromErrors(errorPatterns.syntaxIssues);
    await this.styleValidator.learnFromErrors(errorPatterns.styleIssues);
    await this.responsiveValidator.learnFromErrors(errorPatterns.responsiveIssues);
    
    // Adjust weightings based on feedback
    this.adjustWeightings(feedbackData);
    
    Logger.info('CodeValidatorAgent completed learning cycle');
  }
  
  /**
   * Analyze error patterns in feedback data
   */
  private analyzeErrorPatterns(failures: any[]): {
    syntaxIssues: any[];
    styleIssues: any[];
    responsiveIssues: any[];
    otherIssues: any[];
  } {
    const patterns = {
      syntaxIssues: [],
      styleIssues: [],
      responsiveIssues: [],
      otherIssues: []
    };
    
    for (const item of failures) {
      const error = item.data.error || '';
      
      if (error.includes('syntax') || error.includes('parse') || error.includes('token')) {
        patterns.syntaxIssues.push(item);
      } else if (error.includes('style') || error.includes('lint') || error.includes('formatting')) {
        patterns.styleIssues.push(item);
      } else if (error.includes('responsive') || error.includes('mobile') || error.includes('layout')) {
        patterns.responsiveIssues.push(item);
      } else {
        patterns.otherIssues.push(item);
      }
    }
    
    return patterns;
  }
  
  /**
   * Adjust validation weightings based on feedback
   */
  private adjustWeightings(feedbackData: any[]): void {
    // Count the number of specific issues in each category
    let syntaxIssueCount = 0;
    let styleIssueCount = 0;
    let responsiveIssueCount = 0;
    
    for (const item of feedbackData) {
      if (!item.success) {
        const error = item.data.error || '';
        
        if (error.includes('syntax') || error.includes('parse') || error.includes('token')) {
          syntaxIssueCount++;
        } else if (error.includes('style') || error.includes('lint') || error.includes('formatting')) {
          styleIssueCount++;
        } else if (error.includes('responsive') || error.includes('mobile') || error.includes('layout')) {
          responsiveIssueCount++;
        }
      }
    }
    
    const totalIssues = syntaxIssueCount + styleIssueCount + responsiveIssueCount;
    
    if (totalIssues > 0) {
      // Calculate new weightings based on issue frequency
      // Areas with more issues get higher weight (more attention)
      const newSyntaxWeight = 0.4 + (syntaxIssueCount / totalIssues) * 0.2;
      const newStyleWeight = 0.25 + (styleIssueCount / totalIssues) * 0.2;
      const newResponsiveWeight = 0.15 + (responsiveIssueCount / totalIssues) * 0.2;
      
      // Normalize to ensure weights sum to 1
      const sum = newSyntaxWeight + newStyleWeight + newResponsiveWeight;
      
      this.weightings = {
        syntax: newSyntaxWeight / sum,
        style: newStyleWeight / sum,
        responsive: newResponsiveWeight / sum
      };
      
      Logger.info('Updated validation weightings:', this.weightings);
    }
  }
}
