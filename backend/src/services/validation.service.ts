import { Logger } from '../config/logger';
import { CodeValidatorAgent } from '../agents/code-validator/validator.agent';
import { HttpError } from '../api/middleware/error.middleware';

export class ValidationService {
  private codeValidatorAgent: CodeValidatorAgent;
  
  constructor() {
    this.codeValidatorAgent = new CodeValidatorAgent({
      name: 'Code Validator'
    });
  }
  
  /**
   * Validate generated code
   */
  public async validateCode(code: any, options: any): Promise<any> {
    try {
      Logger.info('Validating generated code');
      
      // Validate the code using the Code Validator Agent
      const validationResult = await this.codeValidatorAgent.execute({
        code,
        options
      });
      
      return validationResult;
    } catch (error) {
      Logger.error('Error validating code:', error);
      throw new HttpError(500, `Failed to validate code: ${error.message}`);
    }
  }
}
