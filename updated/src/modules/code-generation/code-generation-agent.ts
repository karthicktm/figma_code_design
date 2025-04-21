// src/modules/code-generation/code-generation-agent.ts
import axios from 'axios';
import { ComponentRecognitionResult, ExtractedStyles, CodeGenerationResult } from '@/types/agent-interfaces';

export class CodeGenerationAgent {
  private apiKey: string;
  private azureEndpoint: string;
  private deploymentName: string;
  private figmaFileId: string;
  private selectedNodeId: string | null;
  private onProgress?: (progress: number) => void;
  
  constructor(
    apiKey: string,
    azureEndpoint: string,
    deploymentName: string,
    figmaFileId: string,
    onProgress?: (progress: number) => void,
    selectedNodeId: string | null = null
  ) {
    this.apiKey = apiKey;
    this.azureEndpoint = azureEndpoint;
    this.deploymentName = deploymentName;
    this.figmaFileId = figmaFileId;
    this.selectedNodeId = selectedNodeId;
    this.onProgress = onProgress;
  }
  
  async execute(
    componentRecognition: ComponentRecognitionResult,
    styleExtraction: ExtractedStyles
  ): Promise<CodeGenerationResult> {
    try {
      this.updateProgress(5);
      console.log("Inside progress 5")
      // Get the specific node details if a node ID is selected
      let targetComponents = componentRecognition.components;
      if (this.selectedNodeId) {
        // Filter components related to the selected node
        targetComponents = this.getComponentsForNode(
          componentRecognition.components, 
          this.selectedNodeId
        );
        
        if (targetComponents.length === 0) {
          throw new Error(`No components found for node ID: ${this.selectedNodeId}`);
        }
      }
      
      this.updateProgress(10);
      
      // Generate all required Angular components using Azure OpenAI
      const generatedComponents = await this.generateComponentsWithAzureOpenAI(
        targetComponents, 
        styleExtraction
      );
      this.updateProgress(60);
      
      // Generate style files
      const styles = await this.generateStylesWithAzureOpenAI(styleExtraction);
      this.updateProgress(80);
      
      // Generate project structure files (app module, routing, etc.)
      const project = await this.generateProjectFilesWithAzureOpenAI(
        generatedComponents,
        styles
      );
      this.updateProgress(100);
      
      return {
        components: generatedComponents,
        styles,
        project
      };
    } catch (error) {
      console.error('Code Generation Agent error:', error);
      throw new Error(`Failed to generate code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  private updateProgress(progress: number) {
    if (this.onProgress) {
      this.onProgress(progress);
    }
  }
  
  private getComponentsForNode(components: any[], nodeId: string): any[] {
    // Find the component with the matching node ID
    const targetComponent = components.find(comp => comp.id === nodeId);
    
    if (targetComponent) {
      // Return the target component and its children
      return [targetComponent];
    }
    
    // Look for components that might be children of a component with this node ID
    const result: any[] = [];
    components.forEach(comp => {
      if (comp.id.includes(nodeId) || (comp.pattern && comp.pattern.includes(nodeId))) {
        result.push(comp);
      }
      
      // Also check if this component has children that match
      if (comp.children) {
        const childMatches = this.getComponentsForNode(comp.children, nodeId);
        if (childMatches.length > 0) {
          result.push(comp);
          result.push(...childMatches);
        }
      }
    });
    
    return result;
  }
  
  private async generateComponentsWithAzureOpenAI(components: any[], styles: ExtractedStyles): Promise<any[]> {
    const generatedComponents: any[] = [];
    
    // Process each component and generate Angular files
    for (const component of components) {
      const { edsComponentType, name, properties, layout, children } = component;
      
      // Skip components without a proper EDS mapping
      if (!edsComponentType) continue;
      
      // Generate component name in PascalCase
      const componentName = this.getPascalCase(name.replace(/[^a-zA-Z0-9]/g, ' '));
      const selector = `app-${this.getKebabCase(name.replace(/[^a-zA-Z0-9]/g, ' '))}`;
      
      // Prepare prompt for Azure OpenAI
      const prompt = this.buildComponentPrompt(component, componentName, selector, styles);
      
      try {
        // Call Azure OpenAI API to generate component code
        const generatedCode = await this.callAzureOpenAI(prompt);
        
        // Parse and structure the generated code
        const files = this.parseGeneratedComponentCode(generatedCode, componentName);
        
        // Add to generated components
        generatedComponents.push({
          name: componentName,
          files,
          dependencies: this.getDependencies(component, edsComponentType)
        });
      } catch (error) {
        console.error(`Failed to generate component ${componentName}:`, error);
        throw error;
      }
      
      // Update progress incrementally
      this.updateProgress(10 + generatedComponents.length * (50 / components.length));
    }
    
    return generatedComponents;
  }
  
  private async generateStylesWithAzureOpenAI(styles: ExtractedStyles): Promise<any> {
    // Prepare prompt for styles generation
    const prompt = this.buildStylesPrompt(styles);
    
    try {
      // Call Azure OpenAI API to generate styles code
      const generatedCode = await this.callAzureOpenAI(prompt);
      
      // Parse the generated styles code
      return this.parseGeneratedStylesCode(generatedCode);
    } catch (error) {
      console.error('Failed to generate styles:', error);
      throw error;
    }
  }
  
  private async generateProjectFilesWithAzureOpenAI(
    components: any[],
    styles: any
  ): Promise<any> {
    // Prepare prompt for project files generation
    const prompt = this.buildProjectFilesPrompt(components, styles);
    
    try {
      // Call Azure OpenAI API to generate project files
      const generatedCode = await this.callAzureOpenAI(prompt);
      
      // Parse the generated project files
      return this.parseGeneratedProjectFiles(generatedCode);
    } catch (error) {
      console.error('Failed to generate project files:', error);
      throw error;
    }
  }
  
  private async callAzureOpenAI(prompt: string): Promise<string> {
    try {
      // Azure OpenAI API endpoint
      const url = `${this.azureEndpoint}/openai/deployments/${this.deploymentName}/chat/completions?api-version=2023-05-15`;
      
      // API request
      const response = await axios.post(
        url,
        {
          messages: [
            { role: 'system', content: 'You are a specialized AI assistant that converts Figma designs into Angular components using the Ericsson Design System (EDS). You generate high-quality, production-ready Angular code based on component specifications.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2,
          max_tokens: 4000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': this.apiKey
          }
        }
      );
      
      // Extract response content
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Azure OpenAI API call failed:', error);
      throw new Error('Failed to generate code with Azure OpenAI');
    }
  }
  
  private buildComponentPrompt(
    component: any,
    componentName: string,
    selector: string,
    styles: ExtractedStyles
  ): string {
    return `Generate an Angular component using the Ericsson Design System (EDS) based on the following specifications:

Component Details:
- Name: ${componentName}
- Selector: ${selector}
- EDS Component Type: ${component.edsComponentType}
- Properties: ${JSON.stringify(component.properties || {})}
- Layout: ${JSON.stringify(component.layout || {})}
- Styles: ${JSON.stringify(component.styles || {})}

Available Design Tokens:
- Colors: ${JSON.stringify(styles.colors?.slice(0, 5) || [])}
- Typography: ${JSON.stringify(styles.typography?.slice(0, 5) || [])}
- Spacing: ${JSON.stringify(styles.spacing?.slice(0, 5) || [])}

Requirements:
1. Generate the following files:
   - ${componentName}.component.ts
   - ${componentName}.component.html
   - ${componentName}.component.less
   - ${componentName}.module.ts (if needed)

2. Use EDS components and styling:
   - Import EDS styles and components appropriately
   - Apply EDS variables for consistent styling
   - Follow EDS design patterns for the component type

3. Make sure the component:
   - Is properly typed with TypeScript
   - Uses Angular best practices
   - Is responsive and accessible
   - Handles common user interactions

Please return the code for all required files, with each file clearly separated by using markdown code blocks with the filename as a comment at the top of each block.`;
  }
  
  private buildStylesPrompt(styles: ExtractedStyles): string {
    return `Generate the following style files for an Angular application using the Ericsson Design System (EDS) based on these extracted design tokens:

Design Tokens:
- Colors: ${JSON.stringify(styles.colors || [])}
- Typography: ${JSON.stringify(styles.typography || [])}
- Spacing: ${JSON.stringify(styles.spacing || [])}
- Shadows: ${JSON.stringify(styles.shadows || [])}
- Breakpoints: ${JSON.stringify(styles.breakpoints || [])}

Requirements:
1. Generate the following files:
   - variables.css: CSS variables for all design tokens
   - global.css: Global application styles using EDS

2. For variables.css:
   - Define CSS custom properties for all tokens
   - Organize variables by category (colors, typography, etc.)
   - Use the provided edsVariable names

3. For global.css:
   - Import EDS base styles
   - Apply the variables to appropriate global elements
   - Include responsive breakpoints

Please return the code for both files, with each file clearly separated by using markdown code blocks with the filename as a comment at the top of each block.`;
  }
  
  private buildProjectFilesPrompt(components: any[], styles: any): string {
    return `Generate the core Angular project files to integrate components using the Ericsson Design System (EDS).

Components:
${components.map(c => `- ${c.name}Component (selector: app-${this.getKebabCase(c.name)})`).join('\n')}

Requirements:
1. Generate the following files:
   - app.module.ts: Main application module with all component imports
   - app.component.ts: Root component showcasing all generated components
   - app-routing.module.ts: Basic routing configuration for the components

2. For app.module.ts:
   - Import all generated components
   - Import EDS Angular modules as needed
   - Configure necessary providers

3. For app.component.ts:
   - Create a basic layout with EDS styling
   - Include a navigation for all components
   - Implement a router outlet

4. For app-routing.module.ts:
   - Define routes for all components
   - Set up default route
   - Include guard patterns if needed

Please return the code for all required files, with each file clearly separated by using markdown code blocks with the filename as a comment at the top of each block.`;
  }
  
  private parseGeneratedComponentCode(generatedCode: string, componentName: string): any {
    const files: any = {
      componentTs: '',
      componentHtml: '',
      componentLess: '',
      moduleTs: ''
    };
    
    // Extract component.ts
    const tsMatch = generatedCode.match(/```(?:typescript|ts)\s*(?:\/\/\s*.*\.component\.ts)?\s*([\s\S]*?)```/i);
    if (tsMatch && tsMatch[1]) {
      files.componentTs = tsMatch[1].trim();
    }
    
    // Extract component.html
    const htmlMatch = generatedCode.match(/```(?:html)\s*(?:\/\/\s*.*\.component\.html)?\s*([\s\S]*?)```/i);
    if (htmlMatch && htmlMatch[1]) {
      files.componentHtml = htmlMatch[1].trim();
    }
    
    // Extract component.less
    const lessMatch = generatedCode.match(/```(?:less|css)\s*(?:\/\/\s*.*\.component\.less)?\s*([\s\S]*?)```/i);
    if (lessMatch && lessMatch[1]) {
      files.componentLess = lessMatch[1].trim();
    }
    
    // Extract module.ts if present
    const moduleMatch = generatedCode.match(/```(?:typescript|ts)\s*(?:\/\/\s*.*\.module\.ts)?\s*([\s\S]*?)```/i);
    if (moduleMatch && moduleMatch[1] && moduleMatch[1].includes('NgModule')) {
      files.moduleTs = moduleMatch[1].trim();
    }
    
    // If any files are missing, create minimal versions
    if (!files.componentTs) {
      files.componentTs = this.createDefaultComponentTs(componentName);
    }
    
    if (!files.componentHtml) {
      files.componentHtml = `<div>\n  ${componentName} works!\n</div>`;
    }
    
    return files;
  }
  
  private parseGeneratedStylesCode(generatedCode: string): any {
    const variables = generatedCode.match(/```(?:css)\s*(?:\/\/\s*variables\.css)?\s*([\s\S]*?)```/i);
    const global = generatedCode.match(/```(?:css)\s*(?:\/\/\s*global\.css)?\s*([\s\S]*?)```/i);
    
    return {
      variables: variables && variables[1] ? variables[1].trim() : this.createDefaultVariablesCss(),
      global: global && global[1] ? global[1].trim() : this.createDefaultGlobalCss()
    };
  }
  
  private parseGeneratedProjectFiles(generatedCode: string): any {
    // Extract app.module.ts
    const moduleMatch = generatedCode.match(/```(?:typescript|ts)\s*(?:\/\/\s*app\.module\.ts)?\s*([\s\S]*?)```/i);
    const appModule = moduleMatch && moduleMatch[1] ? moduleMatch[1].trim() : this.createDefaultAppModule();
    
    // Extract app.component.ts
    const componentMatch = generatedCode.match(/```(?:typescript|ts)\s*(?:\/\/\s*app\.component\.ts)?\s*([\s\S]*?)```/i);
    const appComponent = componentMatch && componentMatch[1] ? componentMatch[1].trim() : this.createDefaultAppComponent();
    
    // Extract app-routing.module.ts
    const routingMatch = generatedCode.match(/```(?:typescript|ts)\s*(?:\/\/\s*app-routing\.module\.ts)?\s*([\s\S]*?)```/i);
    const routing = routingMatch && routingMatch[1] ? routingMatch[1].trim() : this.createDefaultRoutingModule();
    
    return {
      appModule,
      appComponent,
      routing
    };
  }
  
  private createDefaultComponentTs(componentName: string): string {
    return `import { Component } from '@angular/core';

@Component({
  selector: 'app-${this.getKebabCase(componentName)}',
  templateUrl: './${this.getKebabCase(componentName)}.component.html',
  styleUrls: ['./${this.getKebabCase(componentName)}.component.less']
})
export class ${componentName}Component {
  // Default component implementation
}`;
  }
  
  private createDefaultVariablesCss(): string {
    return `:root {
  /* Colors */
  --primary: #0063A9;
  --secondary: #404040;
  --accent: #009ADA;
  --background: #FFFFFF;
  --foreground: #262626;
  --success: #12855B;
  --warning: #FFAA00;
  --danger: #CA0000;
  
  /* Typography */
  --font-family: 'Hilda', Arial, sans-serif;
  --font-size-base: 16px;
  --line-height-base: 1.5;
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  
  /* Breakpoints */
  --breakpoint-xs: 0;
  --breakpoint-sm: 576px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 992px;
  --breakpoint-xl: 1200px;
}`;
  }
  
  private createDefaultGlobalCss(): string {
    return `@import "@eds/vanilla/eds";

body {
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
  color: var(--foreground);
  background-color: var(--background);
}

h1, h2, h3, h4, h5, h6 {
  margin-top: 0;
  margin-bottom: var(--space-md);
}

.container {
  padding-right: var(--space-md);
  padding-left: var(--space-md);
  margin-right: auto;
  margin-left: auto;
}

@media (min-width: var(--breakpoint-sm)) {
  .container {
    max-width: 540px;
  }
}

@media (min-width: var(--breakpoint-md)) {
  .container {
    max-width: 720px;
  }
}

@media (min-width: var(--breakpoint-lg)) {
  .container {
    max-width: 960px;
  }
}

@media (min-width: var(--breakpoint-xl)) {
  .container {
    max-width: 1140px;
  }
}`;
  }
  
  private createDefaultAppModule(): string {
    return `import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }`;
  }
  
  private createDefaultAppComponent(): string {
    return `import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: \`
    <div class="app-container">
      <h1>Ericsson Design System Angular App</h1>
      <nav>
        <a routerLink="/" routerLinkActive="active">Home</a>
      </nav>
      <main>
        <router-outlet></router-outlet>
      </main>
    </div>
  \`,
  styles: [\`
    .app-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    nav {
      margin-bottom: 20px;
    }
    nav a {
      margin-right: 10px;
    }
  \`]
})
export class AppComponent {
  title = 'eds-angular-app';
}`;
  }
  
  private createDefaultRoutingModule(): string {
    return `import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }`;
  }
  
  private getDependencies(component: any, type: string): string[] {
    // List EDS dependencies based on component type
    const dependencies: string[] = ['@eds/vanilla'];
    
    switch (type) {
      case 'Dialog':
        dependencies.push('@eds/angular');
        break;
      case 'Table':
        dependencies.push('@eds/angular/table');
        break;
      case 'Form':
      case 'Input':
      case 'Select':
      case 'Checkbox':
        dependencies.push('@angular/forms');
        break;
    }
    
    return dependencies;
  }
  
  // Utility methods
  private getPascalCase(str: string): string {
    return str
      .trim()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }
  
  private getKebabCase(str: string): string {
    return str
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }
}