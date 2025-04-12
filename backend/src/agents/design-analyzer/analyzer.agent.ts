import { Agent, AgentOptions } from '../base/agent';
import { PatternDetector } from './pattern-detector';
import { StyleValidator } from './style-validator';
import { Logger } from '../../config/logger';
import { FigmaDesignData, FigmaNode, AnalysisResult, ComponentPattern } from '../../types/figma.types';

interface DesignAnalyzerOptions extends AgentOptions {
  patternDetector?: PatternDetector;
  styleValidator?: StyleValidator;
}

export class DesignAnalyzerAgent extends Agent {
  private patternDetector: PatternDetector;
  private styleValidator: StyleValidator;
  
  constructor(options: DesignAnalyzerOptions) {
    super({
      name: options.name || 'Design Analyzer Agent',
      description: options.description || 'Analyzes Figma designs to detect patterns and validate styles',
      capabilities: [
        'pattern-detection',
        'style-validation',
        'component-identification',
        'metadata-extraction',
        ...(options.capabilities || [])
      ],
      maxMemoryItems: options.maxMemoryItems || 50,
      learningRate: options.learningRate || 0.2,
      feedbackThreshold: options.feedbackThreshold || 0.7
    });
    
    this.patternDetector = options.patternDetector || new PatternDetector();
    this.styleValidator = options.styleValidator || new StyleValidator();
    
    Logger.info('DesignAnalyzerAgent initialized');
  }
  
  /**
   * Analyze a Figma design to detect patterns and validate styles
   */
  public async execute<FigmaDesignData, AnalysisResult>(input: FigmaDesignData): Promise<AnalysisResult> {
    try {
      this.setState({ status: 'processing', lastExecutionTime: Date.now() });
      
      Logger.info('Analyzing Figma design...');
      
      // Check if we've analyzed this design before
      const designId = (input as any).id || 'unknown';
      const cachedResult = await this.recall(`design:${designId}`);
      
      if (cachedResult) {
        Logger.info(`Using cached result for design ${designId}`);
        return cachedResult as AnalysisResult;
      }
      
      // Detect component patterns
      const patterns = await this.patternDetector.detectPatterns(input.nodes);
      
      // Validate styles
      const styleIssues = await this.styleValidator.validateStyles(input.styles);
      
      // Extract metadata
      const metadata = this.extractMetadata(input);
      
      const result = {
        patterns,
        styleIssues,
        metadata,
        enrichedNodes: this.enrichNodesWithPatterns(input.nodes, patterns)
      } as unknown as AnalysisResult;
      
      // Store the result in memory
      await this.remember(`design:${designId}`, result);
      
      // Process successful execution feedback
      await this.processFeedback({
        success: true,
        data: {
          designId,
          patternCount: Object.keys(patterns).length,
          issueCount: styleIssues.length
        }
      });
      
      return result;
    } catch (error) {
      Logger.error('Error analyzing Figma design:', error);
      
      // Process failure feedback
      await this.processFeedback({
        success: false,
        data: {
          error: error instanceof Error ? error.message : String(error),
          input: typeof input === 'object' ? { hasNodes: !!(input as any).nodes } : typeof input
        }
      });
      
      this.setState({ status: 'error' });
      throw error;
    } finally {
      this.setState({ status: 'idle' });
    }
  }
  
  /**
   * Extract metadata from the Figma design
   */
  private extractMetadata(input: FigmaDesignData): Record<string, any> {
    const metadata: Record<string, any> = {
      totalNodes: input.nodes.length,
      componentTypes: 0,
      colorStyles: Object.keys(input.styles.colors || {}).length,
      textStyles: Object.keys(input.styles.textStyles || {}).length,
      effectStyles: Object.keys(input.styles.effects || {}).length,
      nestedComponents: 0
    };
    
    // Count component types
    const componentTypeSet = new Set<string>();
    for (const node of input.nodes) {
      if (node.type === 'COMPONENT' || node.type === 'INSTANCE') {
        componentTypeSet.add(node.name);
      }
      
      // Count nested components
      if (node.children && node.children.length > 0) {
        let hasComponentChild = false;
        for (const childId of node.children) {
          const childNode = input.nodes.find(n => n.id === childId);
          if (childNode && (childNode.type === 'COMPONENT' || childNode.type === 'INSTANCE')) {
            hasComponentChild = true;
            break;
          }
        }
        
        if (hasComponentChild) {
          metadata.nestedComponents++;
        }
      }
    }
    
    metadata.componentTypes = componentTypeSet.size;
    
    return metadata;
  }
  
  /**
   * Enrich nodes with detected pattern information
   */
  private enrichNodesWithPatterns(nodes: FigmaNode[], patterns: Record<string, ComponentPattern>): FigmaNode[] {
    const enrichedNodes = [...nodes];
    
    // Create a map of pattern assignments
    const patternMap = new Map<string, string>();
    
    for (const [patternName, pattern] of Object.entries(patterns)) {
      for (const nodeId of pattern.nodeIds) {
        patternMap.set(nodeId, patternName);
      }
    }
    
    // Enrich nodes with pattern information
    for (const node of enrichedNodes) {
      if (patternMap.has(node.id)) {
        node.pattern = patternMap.get(node.id);
        node.patternConfidence = patterns[node.pattern!].confidence;
      }
    }
    
    return enrichedNodes;
  }
  
  /**
   * Learn from feedback to improve analysis capabilities
   */
  protected async performLearning(feedbackData: any[]): Promise<void> {
    Logger.info(`DesignAnalyzerAgent learning from ${feedbackData.length} feedback items`);
    
    // Filter to only unsuccessful analyses
    const failures = feedbackData.filter(item => !item.success);
    
    if (failures.length === 0) {
      Logger.info('No failures to learn from, skipping learning cycle');
      return;
    }
    
    // Analyze failures to identify patterns
    const errorPatterns = this.analyzeErrorPatterns(failures);
    
    // Update pattern detector based on learning
    if (errorPatterns.patternDetectionIssues.length > 0) {
      await this.patternDetector.learnFromErrors(errorPatterns.patternDetectionIssues);
    }
    
    // Update style validator based on learning
    if (errorPatterns.styleValidationIssues.length > 0) {
      await this.styleValidator.learnFromErrors(errorPatterns.styleValidationIssues);
    }
    
    Logger.info('DesignAnalyzerAgent completed learning cycle');
  }
  
  /**
   * Analyze error patterns in feedback data
   */
  private analyzeErrorPatterns(failures: any[]): {
    patternDetectionIssues: any[];
    styleValidationIssues: any[];
    otherIssues: any[];
  } {
    const patterns = {
      patternDetectionIssues: [],
      styleValidationIssues: [],
      otherIssues: []
    };
    
    for (const item of failures) {
      const error = item.data.error || '';
      
      if (error.includes('pattern') || error.includes('component')) {
        patterns.patternDetectionIssues.push(item);
      } else if (error.includes('style') || error.includes('color') || error.includes('font')) {
        patterns.styleValidationIssues.push(item);
      } else {
        patterns.otherIssues.push(item);
      }
    }
    
    return patterns;
  }
}
