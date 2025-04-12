import { Logger } from '../config/logger';
import { LLMOrchestratorAgent } from '../agents/llm-orchestrator/orchestrator.agent';
import { HttpError } from '../api/middleware/error.middleware';
import { ComponentMapping, GenerationOptions } from '../types/generation.types';

export class GenerationService {
  private llmOrchestratorAgent: LLMOrchestratorAgent;
  
  constructor() {
    this.llmOrchestratorAgent = new LLMOrchestratorAgent({
      name: 'LLM Orchestrator'
    });
  }
  
  /**
   * Generate code based on component mappings
   */
  public async generateCode(mappings: ComponentMapping[], options: GenerationOptions): Promise<any> {
    try {
      Logger.info(`Generating code for ${mappings.length} components using ${options.framework}`);
      
      // Generate code using the LLM Orchestrator Agent
      const result = await this.llmOrchestratorAgent.execute({
        mappings,
        options
      });
      
      return result;
    } catch (error) {
      Logger.error('Error generating code:', error);
      throw new HttpError(500, `Failed to generate code: ${error.message}`);
    }
  }
}
 
