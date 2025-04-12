import { Request, Response, NextFunction } from 'express';
import { Logger } from '../../config/logger';
import { ValidationService } from '../../services/validation.service';
import { HttpError } from '../middleware/error.middleware';

export class ValidationController {
  private validationService: ValidationService;
  
  constructor() {
    this.validationService = new ValidationService();
  }
  
  /**
   * Validate generated code
   */
  public validateCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code, options } = req.body;
      
      if (!code) {
        throw new HttpError(400, 'Invalid request: Missing code');
      }
      
      const result = await this.validationService.validateCode(code, options);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };
} 
