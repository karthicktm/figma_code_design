import { Agent, AgentOptions } from '../base/agent';
import { NodeExtractor } from './node-extractor';
import { StyleExtractor } from './style-extractor';
import { Logger } from '../../config/logger';
import { FigmaFile, FigmaNode, FigmaDesignData } from '../../types/figma.types';

interface FigmaParserOptions extends AgentOptions {
  nodeExtractor?: NodeExtractor;
  styleExtractor?: StyleExtractor;
  flattenNodes?: boolean;
}

interface ParserResult {
  nodes: FigmaNode[];
  styles: Record<string, any>;
  statistics: {
    totalNodes: number;
    components: number;
    frames: number;
    groups: number;
    other: number;
  };
  flattenedStructure?: FigmaNode[];
}

export class FigmaParserAgent extends Agent {
  private nodeExtractor: NodeExtractor;
  private styleExtractor: StyleExtractor;
  private flattenNodes: boolean;
  
  constructor(options: FigmaParserOptions) {
    super({
      name: options.name || 'Figma Parser Agent',
      description: options.description || 'Parses Figma files to extract design data',
      capabilities: [
        'figma-json-parsing',
        'node-extraction',
        'style-extraction',
        'component-identification',
        ...(options.capabilities || [])
      ],
      maxMemoryItems: options.maxMemoryItems || 50,
      learningRate: options.learningRate || 0.15,
      feedbackThreshold: options.feedbackThreshold || 0.75
    });
    
    this.nodeExtractor = options.nodeExtractor || new NodeExtractor();
    this.styleExtractor = options.styleExtractor || new StyleExtractor();
    this.flattenNodes = options.flattenNodes !== undefined ? options.flattenNodes : true;
    
    Logger.info(`FigmaParserAgent initialized with flattenNodes=${this.flattenNodes}`);
  }
  
  /**
   * Parse a Figma file to extract design data
   */
  public async execute<FigmaFile, ParserResult>(input: FigmaFile): Promise<ParserResult> {
    try {
      this.setState({ status: 'processing', lastExecutionTime: Date.now() });
      
      Logger.info('Parsing Figma file...');
      
      // Check if we've parsed this file before
      const fileId = (input as any).document?.id || 'unknown';
      const cachedResult = await this.recall(`file:${fileId}`);
      
      if (cachedResult) {
        Logger.info(`Using cached result for file ${fileId}`);
        return cachedResult as ParserResult;
      }
      
      // Extract nodes from the Figma file
      const nodes = await this.nodeExtractor.extractNodes(input);
      
      // Extract styles from the Figma file
      const styles = await this.styleExtractor.extractStyles(input);
      
      // Calculate statistics
      const statistics = this.calculateStatistics(nodes);
      
      // Create flattened structure if requested
      const flattenedStructure = this.flattenNodes 
        ? await this.nodeExtractor.flattenNodeStructure(input) 
        : undefined;
      
      const result = {
        nodes,
        styles,
        statistics,
        flattenedStructure
      } as unknown as ParserResult;
      
      // Store the result in memory
      await this.remember(`file:${fileId}`, result);
      
      // Process successful execution feedback
      await this.processFeedback({
        success: true,
        data: {
          fileId,
          statistics
        }
      });
      
      return result;
    } catch (error) {
      Logger.error('Error parsing Figma file:', error);
      
      // Process failure feedback
      await this.processFeedback({
        success: false,
        data: {
          error: error instanceof Error ? error.message : String(error),
          input: typeof input === 'object' ? { hasDocument: !!(input as any).document } : typeof input
        }
      });
      
      this.setState({ status: 'error' });
      throw error;
    } finally {
      this.setState({ status: 'idle' });
    }
  }
  
  /**
   * Calculate statistics about the parsed nodes
   */
  private calculateStatistics(nodes: FigmaNode[]): ParserResult['statistics'] {
    const statistics = {
      totalNodes: nodes.length,
      components: 0,
      frames: 0,
      groups: 0,
      other: 0
    };
    
    for (const node of nodes) {
      if (node.type === 'COMPONENT' || node.type === 'INSTANCE') {
        statistics.components++;
      } else if (node.type === 'FRAME') {
        statistics.frames++;
      } else if (node.type === 'GROUP') {
        statistics.groups++;
      } else {
        statistics.other++;
      }
    }
    
    return statistics;
  }
  
  /**
   * Learn from feedback to improve parsing capabilities
   */
  protected async performLearning(feedbackData: any[]): Promise<void> {
    Logger.info(`FigmaParserAgent learning from ${feedbackData.length} feedback items`);
    
    // Filter to only unsuccessful parsings
    const failures = feedbackData.filter(item => !item.success);
    
    if (failures.length === 0) {
      Logger.info('No failures to learn from, skipping learning cycle');
      return;
    }
    
    // Analyze failures to identify patterns
    const errorPatterns = this.analyzeErrorPatterns(failures);
    
    // Update node extractor based on learning
    if (errorPatterns.nodeExtractionIssues.length > 0) {
      await this.nodeExtractor.learnFromErrors(errorPatterns.nodeExtractionIssues);
    }
    
    // Update style extractor based on learning
    if (errorPatterns.styleExtractionIssues.length > 0) {
      await this.styleExtractor.learnFromErrors(errorPatterns.styleExtractionIssues);
    }
    
    Logger.info('FigmaParserAgent completed learning cycle');
  }
  
  /**
   * Analyze error patterns in feedback data
   */
  private analyzeErrorPatterns(failures: any[]): {
    nodeExtractionIssues: any[];
    styleExtractionIssues: any[];
    otherIssues: any[];
  } {
    const patterns = {
      nodeExtractionIssues: [],
      styleExtractionIssues: [],
      otherIssues: []
    };
    
    for (const item of failures) {
      const error = item.data.error || '';
      
      if (error.includes('node') || error.includes('extract')) {
        patterns.nodeExtractionIssues.push(item);
      } else if (error.includes('style') || error.includes('color') || error.includes('font')) {
        patterns.styleExtractionIssues.push(item);
      } else {
        patterns.otherIssues.push(item);
      }
    }
    
    return patterns;
  }
}
