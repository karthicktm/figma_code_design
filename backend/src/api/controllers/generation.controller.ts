import { Request, Response, NextFunction } from 'express';
import { Logger } from '../../config/logger';
import { GenerationService } from '../../services/generation.service';
import { HttpError } from '../middleware/error.middleware';

export class GenerationController {
  private generationService: GenerationService;
  
  constructor() {
    this.generationService = new GenerationService();
  }
  
  /**
   * Generate code based on component mappings
   */
  public generateCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { mappings, options } = req.body;
      
      if (!mappings || !Array.isArray(mappings) || mappings.length === 0) {
        throw new HttpError(400, 'Invalid mappings: Expected non-empty array');
      }
      
      if (!options || !options.framework) {
        throw new HttpError(400, 'Invalid options: Missing framework');
      }
      
      const result = await this.generationService.generateCode(mappings, options);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };
}
