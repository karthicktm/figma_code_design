import { IAgent, CodeGenerationResult, OutputResult } from '@/types/agent-interfaces';
import JSZip from 'jszip';

interface OutputPreviewConfig {
  projectName: string;
}

export class OutputPreviewAgent implements IAgent {
  private projectName: string;
  private onProgress?: (progress: number) => void;
  
  constructor(config: OutputPreviewConfig, onProgress?: (progress: number) => void) {
    this.projectName = config.projectName;
    this.onProgress = onProgress;
  }
  
  async execute(inputs: any[]): Promise<OutputResult> {
    try {
      if (!inputs[0]) {
        throw new Error('No code generation result provided');
      }
      
      const codeResult = inputs[0] as CodeGenerationResult;
      this.updateProgress(10);
      
      // Create project structure
      const projectStructure = this.createProjectStructure(codeResult);
      this.updateProgress(60);
      
      // Create ZIP file
      const zipUrl = await this.createZipFile(projectStructure);
      this.updateProgress(90);
      
      // Create preview
      const previewUrl = this.createPreview(codeResult);
      this.updateProgress(100);
      
      return {
        projectStructure,
        preview: {
          url: previewUrl
        },
        downloadUrl: zipUrl
      };
    } catch (error) {
      console.error('Output Preview Agent error:', error);
      throw new Error(`Failed to prepare output: ${error.message}`);
    }
  }
  
  private updateProgress(progress: number) {
    if (this.onProgress) {
      this.onProgress(progress);
    }
  }
  
  private createProjectStructure(codeResult: CodeGenerationResult): Array<{
    path: string;
    content: string;
  }> {
    const files: Array<{
      path: string;
      content: string;
    }> = [];
    
    // Add project root files
    files.push({
      path: 'package.json',
      content: this.generatePackageJson()
    });
    
    files.push({
      path: 'angular.json',
      content: this.generateAngularJson()
    });
    
    files.push({
      path: 'tsconfig.json',
      content: this.generateTsConfig()
    });
    
    // Add src folder structure
    files.push({
      path: 'src/main.ts',
      content: this.generateMainTs()
    });
    
    files.push({
      path: 'src/index.html',
      content: this.generateIndexHtml()
    });
    
    files.push({
      path: 'src/styles.less',
      content: `/* You can add global styles to this file */
@import './app/styles/variables.less';
@import './app/styles/global.less';
`
    });
    
    // Add app folder
    files.push({
      path: 'src/app/app.module.ts',
      content: codeResult.project.appModule
    });
    
    files.push({
      path: 'src/app/app-routing.module.ts',
      content: codeResult.project.routing
    });
    
    files.push({
      path: 'src/app/app.component.ts',
      content: codeResult.project.appComponent
    });
    
    files.push({
      path: 'src/app/app.component.html',
      content: this.generateAppComponentHtml(codeResult)
    });
    
    files.push({
      path: 'src/app/app.component.less',
      content: `/* App Component Styles */
:host {
  display: block;
  width: 100%;
}
`
    });
    
    // Add styles
    files.push({
      path: 'src/app/styles/variables.less',
      content: codeResult.styles.variables
    });
    
    files.push({
      path: 'src/app/styles/global.less',
      content: codeResult.styles.global
    });
    
    // Add components
    codeResult.components.forEach(component => {
      files.push({
        path: `src/app/components/${component.name}/${component.name}.component.ts`,
        content: component.files.componentTs
      });
      
      files.push({
        path: `src/app/components/${component.name}/${component.name}.component.html`,
        content: component.files.componentHtml
      });
      
      files.push({
        path: `src/app/components/${component.name}/${component.name}.component.less`,
        content: component.files.componentLess
      });
      
      if (component.files.moduleTs) {
        files.push({
          path: `src/app/components/${component.name}/${component.name}.module.ts`,
          content: component.files.moduleTs
        });
      }
    });
    
    return files;
  }
  
  private async createZipFile(
    files: Array<{ path: string; content: string }>
  ): Promise<string> {
    const zip = new JSZip();
    const rootFolder = zip.folder(this.projectName)!;
    
    // Add files to zip
    files.forEach(file => {
      const folderPath = file.path.substring(0, file.path.lastIndexOf('/'));
      const fileName = file.path.substring(file.path.lastIndexOf('/') + 1);
      
      // Create nested folders if needed
      if (folderPath) {
        const folder = rootFolder.folder(folderPath)!;
        folder.file(fileName, file.content);
      } else {
        rootFolder.file(fileName, file.content);
      }
    });
    
    // Generate zip file
    const zipBlob = await zip.generateAsync({ type: "blob" });
    return URL.createObjectURL(zipBlob);
  }
  
  private createPreview(codeResult: CodeGenerationResult): string {
    // In a full implementation, we might create a live preview
    // using an iframe or a web component
    // For now, we just return a placeholder URL
    return '#';
  }
  
  private generatePackageJson(): string {
    return JSON.stringify({
      "name": this.projectName.toLowerCase(),
      "version": "0.0.1",
      "scripts": {
        "ng": "ng",
        "start": "ng serve",
        "build": "ng build",
        "watch": "ng build --watch --configuration development",
        "test": "ng test"
      },
      "private": true,
      "dependencies": {
        "@angular/animations": "^15.2.0",
        "@angular/common": "^15.2.0",
        "@angular/compiler": "^15.2.0",
        "@angular/core": "^15.2.0",
        "@angular/forms": "^15.2.0",
        "@angular/platform-browser": "^15.2.0",
        "@angular/platform-browser-dynamic": "^15.2.0",
        "@angular/router": "^15.2.0",
        "rxjs": "~7.8.0",
        "tslib": "^2.3.0",
        "zone.js": "~0.12.0"
      },
      "devDependencies": {
        "@angular-devkit/build-angular": "^15.2.4",
        "@angular/cli": "~15.2.4",
        "@angular/compiler-cli": "^15.2.0",
        "@types/jasmine": "~4.3.0",
        "jasmine-core": "~4.5.0",
        "karma": "~6.4.0",
        "karma-chrome-launcher": "~3.1.0",
        "karma-coverage": "~2.2.0",
        "karma-jasmine": "~5.1.0",
        "karma-jasmine-html-reporter": "~2.0.0",
        "typescript": "~4.9.4"
      }
    }, null, 2);
  }
  
  private generateAngularJson(): string {
    return JSON.stringify({
      "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
      "version": 1,
      "newProjectRoot": "projects",
      "projects": {
        [this.projectName]: {
          "projectType": "application",
          "schematics": {
            "@schematics/angular:component": {
              "style": "less"
            }
          },
          "root": "",
          "sourceRoot": "src",
          "prefix": "app",
          "architect": {
            "build": {
              "builder": "@angular-devkit/build-angular:browser",
              "options": {
                "outputPath": "dist/" + this.projectName,
                "index": "src/index.html",
                "main": "src/main.ts",
                "polyfills": [
                  "zone.js"
                ],
                "tsConfig": "tsconfig.app.json",
                "inlineStyleLanguage": "less",
                "assets": [
                  "src/favicon.ico",
                  "src/assets"
                ],
                "styles": [
                  "src/styles.less"
                ],
                "scripts": []
              },
              "configurations": {
                "production": {
                  "budgets": [
                    {
                      "type": "initial",
                      "maximumWarning": "500kb",
                      "maximumError": "1mb"
                    },
                    {
                      "type": "anyComponentStyle",
                      "maximumWarning": "2kb",
                      "maximumError": "4kb"
                    }
                  ],
                  "outputHashing": "all"
                },
                "development": {
                  "buildOptimizer": false,
                  "optimization": false,
                  "vendorChunk": true,
                  "extractLicenses": false,
                  "sourceMap": true,
                  "namedChunks": true
                }
              },
              "defaultConfiguration": "production"
            },
            "serve": {
              "builder": "@angular-devkit/build-angular:dev-server",
              "configurations": {
                "production": {
                  "browserTarget": this.projectName + ":build:production"
                },
                "development": {
                  "browserTarget": this.projectName + ":build:development"
                }
              },
              "defaultConfiguration": "development"
            },
            "extract-i18n": {
              "builder": "@angular-devkit/build-angular:extract-i18n",
              "options": {
                "browserTarget": this.projectName + ":build"
              }
            },
            "test": {
              "builder": "@angular-devkit/build-angular:karma",
              "options": {
                "polyfills": [
                  "zone.js",
                  "zone.js/testing"
                ],
                "tsConfig": "tsconfig.spec.json",
                "inlineStyleLanguage": "less",
                "assets": [
                  "src/favicon.ico",
                  "src/assets"
                ],
                "styles": [
                  "src/styles.less"
                ],
                "scripts": []
              }
            }
          }
        }
      }
    }, null, 2);
  }
  
  private generateTsConfig(): string {
    return JSON.stringify({
      "compileOnSave": false,
      "compilerOptions": {
        "baseUrl": "./",
        "outDir": "./dist/out-tsc",
        "forceConsistentCasingInFileNames": true,
        "strict": true,
        "noImplicitOverride": true,
        "noPropertyAccessFromIndexSignature": true,
        "noImplicitReturns": true,
        "noFallthroughCasesInSwitch": true,
        "sourceMap": true,
        "declaration": false,
        "downlevelIteration": true,
        "experimentalDecorators": true,
        "moduleResolution": "node",
        "importHelpers": true,
        "target": "ES2022",
        "module": "ES2022",
        "useDefineForClassFields": false,
        "lib": [
          "ES2022",
          "dom"
        ]
      },
      "angularCompilerOptions": {
        "enableI18nLegacyMessageIdFormat": false,
        "strictInjectionParameters": true,
        "strictInputAccessModifiers": true,
        "strictTemplates": true
      }
    }, null, 2);
  }
  
  private generateMainTs(): string {
    return `import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';


platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
`;
  }
  
  private generateIndexHtml(): string {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${this.projectName}</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
</head>
<body>
  <app-root></app-root>
</body>
</html>
`;
  }
  
  private generateAppComponentHtml(codeResult: CodeGenerationResult): string {
    // Create a basic layout with the generated components
    let html = `<div class="container">
  <header class="header">
    <h1>${this.projectName}</h1>
    <p>Generated from Figma design using EDS</p>
  </header>

  <main class="main-content">
`;

    // Add component examples
    if (codeResult.components.length > 0) {
      html += `    <div class="components-showcase">\n`;
      
      codeResult.components.forEach(component => {
        const componentClassName = component.name.charAt(0).toUpperCase() + component.name.slice(1);
        const selector = `app-${component.name.replace('Component', '')}`;
        
        html += `      <section class="component-section">
        <h2>${componentClassName}</h2>
        <${selector}></${selector}>
      </section>\n`;
      });
      
      html += `    </div>\n`;
    }

    html += `  </main>

  <footer class="footer">
    <p>Generated with Figma to EDS Angular Converter</p>
  </footer>
</div>
`;

    return html;
  }
}