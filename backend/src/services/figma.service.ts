import { Logger } from '../config/logger';
import { FigmaParserAgent } from '../agents/figma-parser/parser.agent';
import { DesignAnalyzerAgent } from '../agents/design-analyzer/analyzer.agent';
import { FigmaApiClient } from '../lib/figma-api/client';
import { HttpError } from '../api/middleware/error.middleware';

export class FigmaService {
  private figmaParserAgent: FigmaParserAgent;
  private designAnalyzerAgent: DesignAnalyzerAgent;
  private figmaApiClient: FigmaApiClient;
  
  constructor() {
    this.figmaParserAgent = new FigmaParserAgent({
      name: 'Figma Parser'
    });
    
    this.designAnalyzerAgent = new DesignAnalyzerAgent({
      name: 'Design Analyzer'
    });
    
    this.figmaApiClient = new FigmaApiClient();
  }
  
  /**
   * Import a Figma design file
   */
  public async importFigmaFile(figmaData: any): Promise<any> {
    try {
      Logger.info('Importing Figma file');
      
      // Parse the file using the Figma Parser Agent
      const parseResult = await this.figmaParserAgent.execute(figmaData);
      
      return {
        ...parseResult,
        id: figmaData.document?.id || 'unknown',
        name: figmaData.name || 'Untitled Figma File',
        lastModified: figmaData.lastModified || new Date().toISOString()
      };
    } catch (error) {
      Logger.error('Error importing Figma file:', error);
      throw new HttpError(500, `Failed to import Figma file: ${error.message}`);
    }
  }
  
  /**
   * Fetch a Figma file via the Figma API
   */
  public async fetchFigmaFile(token: string, fileId: string): Promise<any> {
    try {
      Logger.info(`Fetching Figma file with ID: ${fileId}`);
      
      // Fetch the file from the Figma API
      const figmaFile = await this.figmaApiClient.getFile(token, fileId);
      
      // Parse the file using the Figma Parser Agent
      const parseResult = await this.figmaParserAgent.execute(figmaFile);
      
      return {
        ...parseResult,
        id: figmaFile.document?.id || fileId,
        name: figmaFile.name || 'Untitled Figma File',
        lastModified: figmaFile.lastModified || new Date().toISOString()
      };
    } catch (error) {
      Logger.error('Error fetching Figma file:', error);
      throw new HttpError(500, `Failed to fetch Figma file: ${error.message}`);
    }
  }
  
  /**
   * Analyze a Figma design
   */
  public async analyzeDesign(figmaData: any): Promise<any> {
    try {
      Logger.info('Analyzing Figma design');
      
      // Analyze the design using the Design Analyzer Agent
      const analysisResult = await this.designAnalyzerAgent.execute(figmaData);
      
      return analysisResult;
    } catch (error) {
      Logger.error('Error analyzing Figma design:', error);
      throw new HttpError(500, `Failed to analyze Figma design: ${error.message}`);
    }
  }
}

