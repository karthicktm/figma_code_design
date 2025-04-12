import { Request, Response, NextFunction } from 'express';
import { Logger } from '../../config/logger';
import { FigmaService } from '../../services/figma.service';
import { HttpError } from '../middleware/error.middleware';

export class FigmaController {
  private figmaService: FigmaService;
  
  constructor() {
    this.figmaService = new FigmaService();
  }
  
  /**
   * Import a Figma design file
   */
  public importFigmaFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const figmaData = req.body;
      
      if (!figmaData || !figmaData.document) {
        throw new HttpError(400, 'Invalid Figma data: Missing document property');
      }
      
      const result = await this.figmaService.importFigmaFile(figmaData);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Fetch a Figma file via API
   */
  public fetchFigmaFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, fileId } = req.body;
      
      if (!token) {
        throw new HttpError(400, 'Missing Figma API token');
      }
      
      if (!fileId) {
        throw new HttpError(400, 'Missing Figma file ID');
      }
      
      const result = await this.figmaService.fetchFigmaFile(token, fileId);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Analyze a Figma design
   */
  public analyzeDesign = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const figmaData = req.body;
      
      if (!figmaData || !figmaData.nodes) {
        throw new HttpError(400, 'Invalid design data: Missing nodes property');
      }
      
      const result = await this.figmaService.analyzeDesign(figmaData);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };
} 
