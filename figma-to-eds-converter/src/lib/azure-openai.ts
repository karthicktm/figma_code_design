import { OpenAIClient, AzureKeyCredential, GetChatCompletionsOptions } from "@azure/openai";

export interface CodeGenerationRequest {
  componentName: string;
  edsComponentType: string;
  properties: Record<string, any>;
  designTokens: Record<string, any>;
  layout?: any;
  children?: any[];
}

export interface CodeGenerationResult {
  componentTs: string;
  componentHtml: string;
  componentLess: string;
  moduleTs?: string;
}

export class AzureOpenAIService {
  private client: OpenAIClient;
  private deploymentName: string;
  
  constructor(endpoint: string, apiKey: string, deploymentName: string) {
    this.client = new OpenAIClient(endpoint, new AzureKeyCredential(apiKey));
    this.deploymentName = deploymentName;
  }
  
  async generateAngularComponent(request: CodeGenerationRequest): Promise<CodeGenerationResult> {
    const prompt = this.buildComponentPrompt(request);
    
    const options: GetChatCompletionsOptions = {
      temperature: 0.2,
      maxTokens: 3000,
    };
    
    const messages = [
      { role: "system", content: this.getSystemPrompt() },
      { role: "user", content: prompt }
    ];
    
    try {
      const response = await this.client.getChatCompletions(
        this.deploymentName,
        messages,
        options
      );
      
      const content = response.choices[0].message?.content || '';
      return this.parseGeneratedCode(content);
    } catch (error) {
      console.error("Error generating Angular component:", error);
      throw new Error(`Failed to generate Angular component: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  private getSystemPrompt(): string {
    return `
    You are an expert Angular developer with deep knowledge of EDS (Ericsson Design System) library.
    Your task is to generate Angular components using the EDS design system based on Figma designs.
    Provide only the code without explanations. Follow these rules:
    
    1. Use proper EDS classes and components based on the component type provided
    2. Follow the exact HTML structure required by EDS components
    3. Apply EDS styling patterns using LESS
    4. Implement responsive behaviors using EDS breakpoints
    5. Use EDS design tokens for styling variables
    
    Respond with four separate code blocks for:
    1. Component TypeScript (.ts)
    2. Component Template (.html)
    3. Component Styles (.less)
    4. Module TypeScript (if needed, .ts)
    
    Each code block should be surrounded by appropriate markdown code block syntax.
    `;
  }
  
  private buildComponentPrompt(request: CodeGenerationRequest): string {
    const { componentName, edsComponentType, properties, designTokens, layout, children } = request;
    
    return `
    Generate an Angular component using the EDS design system library with the following specifications:
    
    Component Name: ${componentName}
    EDS Component Type: ${edsComponentType}
    Properties: ${JSON.stringify(properties, null, 2)}
    Design Tokens: ${JSON.stringify(designTokens, null, 2)}
    Layout: ${layout ? JSON.stringify(layout, null, 2) : 'Standard layout'}
    Children: ${children ? JSON.stringify(children, null, 2) : 'No children'}
    
    The component should use EDS patterns from the examples you've been trained on.
    `;
  }
  
  private parseGeneratedCode(content: string): CodeGenerationResult {
    const result: CodeGenerationResult = {
      componentTs: '',
      componentHtml: '',
      componentLess: '',
    };
    
    // Extract TypeScript code
    const tsMatch = content.match(/```typescript\s*([\s\S]*?)\s*```/);
    if (tsMatch) {
      result.componentTs = tsMatch[1].trim();
    }
    
    // Extract HTML code
    const htmlMatch = content.match(/```html\s*([\s\S]*?)\s*```/);
    if (htmlMatch) {
      result.componentHtml = htmlMatch[1].trim();
    }
    
    // Extract LESS code
    const lessMatch = content.match(/```less\s*([\s\S]*?)\s*```/);
    if (lessMatch) {
      result.componentLess = lessMatch[1].trim();
    }
    
    // Extract Module code (if present)
    const moduleMatch = content.match(/```typescript\s*\/\/ Module\s*([\s\S]*?)\s*```/);
    if (moduleMatch) {
      result.moduleTs = moduleMatch[1].trim();
    }
    
    return result;
  }
}