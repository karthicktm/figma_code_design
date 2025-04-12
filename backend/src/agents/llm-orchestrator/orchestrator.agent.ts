import { Agent, AgentOptions } from '../base/agent';
import { Logger } from '../../config/logger';
import { FrameworkAdapter } from './framework-adapters/base-adapter';
import { ReactAdapter } from './framework-adapters/react.adapter';
import { VueAdapter } from './framework-adapters/vue.adapter';
import { AngularAdapter } from './framework-adapters/angular.adapter';
import { HtmlAdapter } from './framework-adapters/html.adapter';
import { LLM } from '../../lib/ai/llm';
import { 
  CodeGenerationRequest, 
  CodeGenerationResult, 
  GenerationOptions, 
  ComponentMapping 
} from '../../types/generation.types';

interface OrchestratorOptions extends AgentOptions {
  llm?: LLM;
}

export class LLMOrchestratorAgent extends Agent {
  private llm: LLM;
  private adapters: Map<string, FrameworkAdapter>;
  private templateCache: Map<string, string>;
  
  constructor(options: OrchestratorOptions) {
    super({
      name: options.name || 'LLM Orchestrator Agent',
      description: options.description || 'Orchestrates code generation using LLMs',
      capabilities: [
        'code-generation',
        'template-management',
        'framework-adaptation',
        'component-composition',
        ...(options.capabilities || [])
      ],
      maxMemoryItems: options.maxMemoryItems || 100,
      learningRate: options.learningRate || 0.1,
      feedbackThreshold: options.feedbackThreshold || 0.7
    });
    
    this.llm = options.llm || new LLM();
    this.adapters = new Map();
    this.templateCache = new Map();
    
    // Initialize framework adapters
    this.initializeAdapters();
    
    Logger.info('LLMOrchestratorAgent initialized');
  }
  
  /**
   * Initialize framework-specific adapters
   */
  private initializeAdapters(): void {
    this.adapters.set('react', new ReactAdapter());
    this.adapters.set('vue', new VueAdapter());
    this.adapters.set('angular', new AngularAdapter());
    this.adapters.set('html', new HtmlAdapter());
    
    Logger.info('Framework adapters initialized');
  }
  
  /**
   * Generate code based on component mappings
   */
  public async execute<CodeGenerationRequest, CodeGenerationResult>(
    request: CodeGenerationRequest
  ): Promise<CodeGenerationResult> {
    try {
      this.setState({ status: 'processing', lastExecutionTime: Date.now() });
      
      Logger.info('Generating code...');
      
      const { mappings, options } = request as unknown as {
        mappings: ComponentMapping[];
        options: GenerationOptions;
      };
      
      // Get the appropriate framework adapter
      const adapter = this.adapters.get(options.framework);
      
      if (!adapter) {
        throw new Error(`Unsupported framework: ${options.framework}`);
      }
      
      // Check if we have a cached version of this request
      const cacheKey = this.generateCacheKey(mappings, options);
      const cachedResult = await this.recall(cacheKey);
      
      if (cachedResult) {
        Logger.info(`Using cached result for ${options.framework} generation`);
        return cachedResult as CodeGenerationResult;
      }
      
      // Generate components
      const components = await this.generateComponents(mappings, options, adapter);
      
      // Generate layout if requested
      let layout = null;
      if (options.generateLayout) {
        layout = await this.generateLayout(mappings, components, options, adapter);
      }
      
      // Prepare the result
      const result = {
        components,
        layout,
        options,
        metadata: {
          timestamp: Date.now(),
          componentCount: components.length,
          framework: options.framework,
          typescript: options.typescript,
          styling: options.styling
        }
      } as unknown as CodeGenerationResult;
      
      // Store the result in memory
      await this.remember(cacheKey, result);
      
      // Process successful execution feedback
      await this.processFeedback({
        success: true,
        data: {
          framework: options.framework,
          componentCount: components.length,
          options
        }
      });
      
      return result;
    } catch (error) {
      Logger.error('Error generating code:', error);
      
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
   * Generate a cache key for a specific request
   */
  private generateCacheKey(mappings: ComponentMapping[], options: GenerationOptions): string {
    const mappingsHash = JSON.stringify(mappings.map(m => ({
      figmaId: m.figmaComponent.id,
      edsId: m.edsComponent.id
    })));
    
    return `generation:${options.framework}:${options.styling}:${options.typescript}:${options.generateLayout}:${mappingsHash}`;
  }
  
  /**
   * Generate code for individual components
   */
  private async generateComponents(
    mappings: ComponentMapping[],
    options: GenerationOptions,
    adapter: FrameworkAdapter
  ): Promise<any[]> {
    const components = [];
    
    // Process each mapping to generate a component
    for (const mapping of mappings) {
      try {
        Logger.info(`Generating ${options.framework} component for "${mapping.edsComponent.name}"`);
        
        // Get the component template
        const templateKey = `${options.framework}:${mapping.edsComponent.type || 'default'}:${options.styling}`;
        let template = await this.getTemplate(templateKey);
        
        // If no specific template exists, fall back to the default template
        if (!template) {
          const defaultTemplateKey = `${options.framework}:default:${options.styling}`;
          template = await this.getTemplate(defaultTemplateKey);
          
          if (!template) {
            Logger.warn(`No template found for ${templateKey} or ${defaultTemplateKey}, using adapter default`);
            template = adapter.getDefaultTemplate(mapping.edsComponent.type, options);
          }
        }
        
        // Prepare the component definition for the LLM
        const componentDefinition = {
          figmaComponent: mapping.figmaComponent,
          edsComponent: mapping.edsComponent,
          properties: mapping.properties || {},
          confidence: mapping.confidence
        };
        
        // Generate the component code
        const componentCode = await this.generateComponentCode(
          componentDefinition,
          template,
          options,
          adapter
        );
        
        components.push({
          name: mapping.edsComponent.name,
          type: mapping.edsComponent.type || 'unknown',
          files: componentCode.files,
          metadata: {
            figmaId: mapping.figmaComponent.id,
            edsId: mapping.edsComponent.id,
            confidence: mapping.confidence
          }
        });
      } catch (error) {
        Logger.error(`Error generating component "${mapping.edsComponent.name}":`, error);
        
        // Add a placeholder for the failed component
        components.push({
          name: mapping.edsComponent.name,
          type: mapping.edsComponent.type || 'unknown',
          files: {
            [`${mapping.edsComponent.name}.error.txt`]: `Error generating component: ${error instanceof Error ? error.message : String(error)}`
          },
          metadata: {
            figmaId: mapping.figmaComponent.id,
            edsId: mapping.edsComponent.id,
            confidence: mapping.confidence,
            error: true
          }
        });
      }
    }
    
    return components;
  }
  
  /**
   * Generate code for a layout combining multiple components
   */
  private async generateLayout(
    mappings: ComponentMapping[],
    components: any[],
    options: GenerationOptions,
    adapter: FrameworkAdapter
  ): Promise<any> {
    try {
      Logger.info(`Generating ${options.framework} layout`);
      
      // Get the layout template
      const templateKey = `${options.framework}:layout:${options.styling}`;
      let template = await this.getTemplate(templateKey);
      
      if (!template) {
        Logger.warn(`No layout template found for ${templateKey}, using adapter default`);
        template = adapter.getDefaultLayoutTemplate(options);
      }
      
      // Prepare the layout definition
      const layoutDefinition = {
        components: components.map(comp => ({
          name: comp.name,
          type: comp.type,
          metadata: comp.metadata
        })),
        options
      };
      
      // Generate the layout code
      const layoutCode = await this.generateLayoutCode(
        layoutDefinition,
        template,
        options,
        adapter
      );
      
      return {
        name: 'Layout',
        files: layoutCode.files,
        metadata: {
          componentCount: components.length,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      Logger.error('Error generating layout:', error);
      
      // Return an error placeholder
      return {
        name: 'Layout',
        files: {
          'Layout.error.txt': `Error generating layout: ${error instanceof Error ? error.message : String(error)}`
        },
        metadata: {
          error: true,
          timestamp: Date.now()
        }
      };
    }
  }
  
  /**
   * Get a code generation template
   */
  private async getTemplate(key: string): Promise<string | null> {
    // Check the cache first
    if (this.templateCache.has(key)) {
      return this.templateCache.get(key)!;
    }
    
    // In a real system, we would load templates from a database or file system
    // For this example, we'll return null to fall back to adapter defaults
    return null;
  }
  
  /**
   * Generate code for a specific component using LLM
   */
  private async generateComponentCode(
    componentDefinition: any,
    template: string,
    options: GenerationOptions,
    adapter: FrameworkAdapter
  ): Promise<{ files: Record<string, string> }> {
    // Prepare the prompt for the LLM
    const prompt = `
      Generate ${options.framework} code for a UI component based on this definition:
      ${JSON.stringify(componentDefinition, null, 2)}
      
      Framework: ${options.framework}
      TypeScript: ${options.typescript ? 'Yes' : 'No'}
      Styling approach: ${options.styling}
      
      Use this template as a guide:
      ${template}
      
      Return the code as valid JSON with this structure:
      {
        "files": {
          "filename1.ext": "file contents",
          "filename2.ext": "file contents"
        }
      }
      
      Follow these additional guidelines:
      - Use appropriate file extensions (${adapter.getFileExtensions(options).join(', ')})
      - Include all necessary imports
      - Implement all specified properties and features
      - Follow best practices for the ${options.framework} framework
      - Make the component responsive and accessible
      - Use ${options.styling} for styling as specified
    `;
    
    // Generate code using LLM
    const response = await this.llm.generate(prompt);
    
    // Parse the response
    try {
      const responseJson = this.extractJsonFromResponse(response);
      
      // Validate and process the generated code
      const processedCode = adapter.processGeneratedCode(responseJson, options);
      
      return processedCode;
    } catch (error) {
      Logger.error('Error parsing LLM response:', error);
      throw new Error(`Failed to parse generated code: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Generate code for a layout combining multiple components using LLM
   */
  private async generateLayoutCode(
    layoutDefinition: any,
    template: string,
    options: GenerationOptions,
    adapter: FrameworkAdapter
  ): Promise<{ files: Record<string, string> }> {
    // Prepare the prompt for the LLM
    const prompt = `
      Generate a ${options.framework} layout that combines these components:
      ${JSON.stringify(layoutDefinition.components, null, 2)}
      
      Framework: ${options.framework}
      TypeScript: ${options.typescript ? 'Yes' : 'No'}
      Styling approach: ${options.styling}
      
      Use this template as a guide:
      ${template}
      
      Return the code as valid JSON with this structure:
      {
        "files": {
          "filename1.ext": "file contents",
          "filename2.ext": "file contents"
        }
      }
      
      Follow these additional guidelines:
      - Use appropriate file extensions (${adapter.getFileExtensions(options).join(', ')})
      - Include all necessary imports for the components
      - Create a responsive layout that showcases all components
      - Follow best practices for the ${options.framework} framework
      - Make the layout accessible and organized
      - Use ${options.styling} for styling as specified
    `;
    
    // Generate code using LLM
    const response = await this.llm.generate(prompt);
    
    // Parse the response
    try {
      const responseJson = this.extractJsonFromResponse(response);
      
      // Validate and process the generated code
      const processedCode = adapter.processGeneratedCode(responseJson, options);
      
      return processedCode;
    } catch (error) {
      Logger.error('Error parsing LLM response for layout:', error);
      throw new Error(`Failed to parse generated layout code: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Extract JSON from LLM response
   */
  private extractJsonFromResponse(response: string): any {
    // Look for JSON block in the response
    const jsonMatch = response.match(/```(?:json)?([\s\S]*?)```/) || 
                     response.match(/{[\s\S]*}/);
    
    if (jsonMatch) {
      const jsonStr = jsonMatch[0].replace(/```json|```/g, '');
      return JSON.parse(jsonStr);
    }
    
    throw new Error('No valid JSON found in the response');
  }
  
  /**
   * Learn from past errors to improve code generation
   */
  protected async performLearning(feedbackData: any[]): Promise<void> {
    Logger.info(`LLMOrchestratorAgent learning from ${feedbackData.length} feedback items`);
    
    // Filter to only unsuccessful generations
    const failures = feedbackData.filter(item => !item.success);
    
    if (failures.length === 0) {
      Logger.info('No failures to learn from, skipping learning cycle');
      return;
    }
    
    // Analyze failures by framework
    const frameworkFailures: Record<string, any[]> = {
      react: [],
      vue: [],
      angular: [],
      html: []
    };
    
    for (const failure of failures) {
      const framework = failure.data.request?.options?.framework || 'unknown';
      if (frameworkFailures[framework]) {
        frameworkFailures[framework].push(failure);
      }
    }
    
    // Update adapters based on learning
    for (const [framework, failures] of Object.entries(frameworkFailures)) {
      if (failures.length > 0) {
        const adapter = this.adapters.get(framework);
        if (adapter) {
          await adapter.learnFromErrors(failures);
        }
      }
    }
    
    // Update LLM prompt templates based on common errors
    await this.updatePromptsFromFeedback(failures);
    
    Logger.info('LLMOrchestratorAgent completed learning cycle');
  }
  
  /**
   * Update prompts based on feedback
   */
  private async updatePromptsFromFeedback(failures: any[]): Promise<void> {
    // Analyze error patterns
    const errorTypes = failures.map(f => {
      const error = f.data.error || '';
      
      if (error.includes('import') || error.includes('missing dependency')) {
        return 'import-error';
      } else if (error.includes('typescript') || error.includes('type') || error.includes('interface')) {
        return 'typescript-error';
      } else if (error.includes('style') || error.includes('css') || error.includes('tailwind')) {
        return 'styling-error';
      } else if (error.includes('component') || error.includes('props') || error.includes('property')) {
        return 'component-error';
      } else {
        return 'other-error';
      }
    });
    
    // Count error types
    const errorCounts: Record<string, number> = {};
    for (const type of errorTypes) {
      errorCounts[type] = (errorCounts[type] || 0) + 1;
    }
    
    // Find the most common error type
    let mostCommonError = 'other-error';
    let maxCount = 0;
    
    for (const [type, count] of Object.entries(errorCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonError = type;
      }
    }
    
    // Update prompts based on most common error
    Logger.info(`Most common error type: ${mostCommonError} (${maxCount} occurrences)`);
    
    // In a real system, we would update the prompt templates stored in a database
    // For this example, we'll just log what we would update
    switch (mostCommonError) {
      case 'import-error':
        Logger.info('Updating prompts to emphasize correct imports');
        break;
      case 'typescript-error':
        Logger.info('Updating prompts to improve TypeScript type definitions');
        break;
      case 'styling-error':
        Logger.info('Updating prompts to improve styling guidance');
        break;
      case 'component-error':
        Logger.info('Updating prompts to enhance component property handling');
        break;
    }
  }
} 
