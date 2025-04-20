import { IAgent, ComponentRecognitionResult, ExtractedStyles, CodeGenerationResult, GeneratedComponent, RecognizedComponent } from '@/types/agent-interfaces';
import { AzureOpenAIService, CodeGenerationRequest } from '@/lib/azure-openai';

interface CodeGenerationConfig {
  azureEndpoint: string;
  apiKey: string;
  deploymentName: string;
}

export class CodeGenerationAgent implements IAgent {
  private azureOpenAIService: AzureOpenAIService;
  private onProgress?: (progress: number) => void;
  
  constructor(config: CodeGenerationConfig, onProgress?: (progress: number) => void) {
    this.azureOpenAIService = new AzureOpenAIService(
      config.azureEndpoint,
      config.apiKey,
      config.deploymentName
    );
    this.onProgress = onProgress;
  }
  
  async execute(inputs: any[]): Promise<CodeGenerationResult> {
    try {
      if (!inputs[0] || !inputs[1]) {
        throw new Error('Missing required inputs');
      }
      
      const componentResult = inputs[0] as ComponentRecognitionResult;
      const extractedStyles = inputs[1] as ExtractedStyles;
      
      this.updateProgress(5);
      
      // Generate components
      const components = await this.generateComponents(componentResult.components, extractedStyles);
      this.updateProgress(80);
      
      // Generate styles
      const styles = this.generateStyles(extractedStyles);
      this.updateProgress(90);
      
      // Generate project structure
      const project = this.generateProjectStructure(components);
      this.updateProgress(100);
      
      return {
        components,
        styles,
        project
      };
    } catch (error) {
      console.error('Code Generation Agent error:', error);
      throw new Error(`Failed to generate code: ${error.message}`);
    }
  }
  
  private updateProgress(progress: number) {
    if (this.onProgress) {
      this.onProgress(progress);
    }
  }
  
  private async generateComponents(
    recognizedComponents: RecognizedComponent[],
    extractedStyles: ExtractedStyles
  ): Promise<GeneratedComponent[]> {
    const generatedComponents: GeneratedComponent[] = [];
    const totalComponents = recognizedComponents.length;
    
    // Filter out components that are too simple or generic
    const significantComponents = recognizedComponents.filter(component => {
      return this.isSignificantComponent(component);
    });
    
    // Process each component
    for (let i = 0; i < significantComponents.length; i++) {
      const component = significantComponents[i];
      this.updateProgress(5 + Math.round((i / significantComponents.length) * 75));
      
      try {
        // Create a proper Angular component name
        const componentName = this.formatComponentName(component.name || `Component${i}`);
        
        // Prepare design tokens for this component
        const designTokens = this.prepareDesignTokens(component, extractedStyles);
        
        // Check for dependencies on other components
        const dependencies = this.findComponentDependencies(component, recognizedComponents);
        
        // Generate component code using Azure OpenAI
        const request: CodeGenerationRequest = {
          componentName,
          edsComponentType: component.edsComponentType,
          properties: component.properties,
          designTokens,
          layout: component.layout,
          children: component.children
        };
        
        const generatedCode = await this.azureOpenAIService.generateAngularComponent(request);
        
        generatedComponents.push({
          name: componentName,
          files: generatedCode,
          dependencies
        });
      } catch (error) {
        console.error(`Error generating component ${component.name}:`, error);
        // Continue with the next component instead of failing the whole process
      }
    }
    
    return generatedComponents;
  }
  
  private generateStyles(extractedStyles: ExtractedStyles): {
    variables: string;
    global: string;
  } {
    // Generate variables.less file with all the extracted design tokens
    let variablesContent = `/* EDS Variables - Generated from design */\n\n`;
    variablesContent += `:root {\n`;
    
    // Colors
    variablesContent += `  /* Colors */\n`;
    extractedStyles.colors.forEach(color => {
      variablesContent += `  --color-${color.name}: ${color.value};\n`;
    });
    
    // Typography
    variablesContent += `\n  /* Typography */\n`;
    variablesContent += `  --font-primary: 'Ericsson Hilda', sans-serif;\n`;
    variablesContent += `  --font-secondary: 'Helvetica Neue', Arial, sans-serif;\n`;
    
    // Font sizes
    variablesContent += `\n  /* Font Sizes */\n`;
    const uniqueFontSizes = new Set<string>();
    extractedStyles.typography.forEach(type => {
      const fontSize = type.fontSize;
      if (!uniqueFontSizes.has(fontSize)) {
        uniqueFontSizes.add(fontSize);
        const sizeName = fontSize.replace('px', '');
        variablesContent += `  --text-${sizeName}: ${fontSize};\n`;
      }
    });
    
    // Spacing
    variablesContent += `\n  /* Spacing */\n`;
    extractedStyles.spacing.forEach(space => {
      variablesContent += `  --space-${space.name.replace('space_', '')}: ${space.value};\n`;
    });
    
    // Shadows
    variablesContent += `\n  /* Shadows */\n`;
    extractedStyles.shadows.forEach(shadow => {
      variablesContent += `  --${shadow.name}: ${shadow.value};\n`;
    });
    
    // Breakpoints
    variablesContent += `\n  /* Breakpoints */\n`;
    extractedStyles.breakpoints.forEach(breakpoint => {
      variablesContent += `  --${breakpoint.name}: ${breakpoint.value};\n`;
    });
    
    variablesContent += `}\n`;
    
    // Generate global.less file with base styles
    let globalContent = `/* Global Styles - Generated from design */\n\n`;
    globalContent += `@import './variables.less';\n\n`;
    
    // Base styles
    globalContent += `body {\n`;
    globalContent += `  font-family: var(--font-primary);\n`;
    globalContent += `  font-size: var(--text-base);\n`;
    globalContent += `  line-height: 1.5;\n`;
    globalContent += `  color: #333333;\n`;
    globalContent += `  margin: 0;\n`;
    globalContent += `  padding: 0;\n`;
    globalContent += `}\n\n`;
    
    // Headings
    globalContent += `h1, h2, h3, h4, h5, h6 {\n`;
    globalContent += `  margin-top: 0;\n`;
    globalContent += `  font-weight: 500;\n`;
    globalContent += `}\n\n`;
    
    // Specific heading styles
    globalContent += `h1 { font-size: var(--text-4xl); }\n`;
    globalContent += `h2 { font-size: var(--text-3xl); }\n`;
    globalContent += `h3 { font-size: var(--text-2xl); }\n`;
    globalContent += `h4 { font-size: var(--text-xl); }\n`;
    globalContent += `h5 { font-size: var(--text-lg); }\n`;
    globalContent += `h6 { font-size: var(--text-base); }\n\n`;
    
    // Common spacing reset
    globalContent += `p, ul, ol {\n`;
    globalContent += `  margin-top: 0;\n`;
    globalContent += `  margin-bottom: var(--space-base);\n`;
    globalContent += `}\n\n`;
    
    // Container classes
    globalContent += `.container {\n`;
    globalContent += `  width: 100%;\n`;
    globalContent += `  padding-right: var(--space-base);\n`;
    globalContent += `  padding-left: var(--space-base);\n`;
    globalContent += `  margin-right: auto;\n`;
    globalContent += `  margin-left: auto;\n`;
    globalContent += `}\n\n`;
    
    // Responsive containers
    globalContent += `@media (min-width: var(--breakpoint-sm)) {\n`;
    globalContent += `  .container { max-width: 640px; }\n`;
    globalContent += `}\n\n`;
    
    globalContent += `@media (min-width: var(--breakpoint-md)) {\n`;
    globalContent += `  .container { max-width: 768px; }\n`;
    globalContent += `}\n\n`;
    
    globalContent += `@media (min-width: var(--breakpoint-lg)) {\n`;
    globalContent += `  .container { max-width: 1024px; }\n`;
    globalContent += `}\n\n`;
    
    globalContent += `@media (min-width: var(--breakpoint-xl)) {\n`;
    globalContent += `  .container { max-width: 1280px; }\n`;
    globalContent += `}\n`;
    
    return {
      variables: variablesContent,
      global: globalContent
    };
  }
  
  private generateProjectStructure(components: GeneratedComponent[]): {
    appModule: string;
    appComponent: string;
    routing: string;
  } {
    // Generate app.module.ts
    let appModuleContent = `import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Import generated components
${components.map(comp => `import { ${this.getComponentClassName(comp.name)} } from './components/${comp.name}/${comp.name}.component';`).join('\n')}

@NgModule({
  declarations: [
    AppComponent,
    ${components.map(comp => this.getComponentClassName(comp.name)).join(',\n    ')}
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
`;

    // Generate app.component.ts
    let appComponentContent = `import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent {
  title = 'Generated EDS App';
}
`;

    // Generate app-routing.module.ts
    let routingContent = `import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
`;

    return {
      appModule: appModuleContent,
      appComponent: appComponentContent,
      routing: routingContent
    };
  }
  
  // Helper methods
  private isSignificantComponent(component: RecognizedComponent): boolean {
    // Skip components that are too basic or wouldn't make sense as standalone
    const basicTypes = ['text', 'box', 'unknown', 'group'];
    
    if (basicTypes.includes(component.edsComponentType)) {
      // Check if it has significant properties or many children
      const hasSignificantProps = 
        component.properties && 
        Object.keys(component.properties).length > 3;
      
      const hasChildren = 
        component.children && 
        component.children.length > 0;
      
      if (!hasSignificantProps && !hasChildren) {
        return false;
      }
    }
    
    return true;
  }
  
  private formatComponentName(name: string): string {
    // Ensure name starts with a lowercase letter
    let formattedName = name.charAt(0).toLowerCase() + name.slice(1);
    
    // Ensure it's a valid component name
    formattedName = formattedName.replace(/[^a-zA-Z0-9]/g, '');
    
    // Add component suffix if not present
    if (!formattedName.includes('component')) {
      formattedName += 'Component';
    }
    
    return formattedName;
  }
  
  private getComponentClassName(componentName: string): string {
    return componentName.charAt(0).toUpperCase() + componentName.slice(1);
  }
  
  private prepareDesignTokens(
    component: RecognizedComponent,
    extractedStyles: ExtractedStyles
  ): Record<string, any> {
    const designTokens: Record<string, any> = {};
    
    // Map component colors to design tokens
    if (component.styles && component.styles.colors) {
      const colorTokens: any[] = [];
      component.styles.colors.forEach(color => {
        // Find matching color in extracted styles
        const matchingColor = extractedStyles.colors.find(c => c.value === color);
        if (matchingColor) {
          colorTokens.push({
            name: matchingColor.name,
            value: matchingColor.value,
            edsVariable: matchingColor.edsVariable
          });
        } else {
          colorTokens.push({
            name: `color_${colorTokens.length + 1}`,
            value: color,
            edsVariable: color
          });
        }
      });
      designTokens.colors = colorTokens;
    }
    
    // Map typography
    if (component.styles && component.styles.typography) {
      const typo = component.styles.typography;
      const matchingTypo = extractedStyles.typography.find(t => 
        t.fontFamily === typo.fontFamily && 
        t.fontSize === `${typo.fontSize}px`
      );
      
      if (matchingTypo) {
        designTokens.typography = {
          ...typo,
          edsVariable: matchingTypo.edsVariable
        };
      } else {
        designTokens.typography = typo;
      }
    }
    
    // Include layout tokens
    if (component.layout) {
      designTokens.layout = {
        ...component.layout,
        responsive: {
          sm: extractedStyles.breakpoints[0].value,
          md: extractedStyles.breakpoints[1].value,
          lg: extractedStyles.breakpoints[2].value,
          xl: extractedStyles.breakpoints[3].value
        }
      };
    }
    
    return designTokens;
  }
  
  private findComponentDependencies(
    component: RecognizedComponent,
    allComponents: RecognizedComponent[]
  ): string[] {
    const dependencies: string[] = [];
    
    // Check if any children reference other components
    const checkForDependencies = (node: RecognizedComponent) => {
      if (!node.children) return;
      
      node.children.forEach(child => {
        // Check if this child is a recognized component
        const matchingComponent = allComponents.find(c => c.id === child.id);
        if (matchingComponent && matchingComponent.id !== component.id) {
          const dependencyName = this.formatComponentName(matchingComponent.name);
          if (!dependencies.includes(dependencyName)) {
            dependencies.push(dependencyName);
          }
        }
        
        // Recursively check this child's children
        checkForDependencies(child);
      });
    };
    
    checkForDependencies(component);
    return dependencies;
  }
}