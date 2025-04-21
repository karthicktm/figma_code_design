// src/modules/output-preview/output-preview-agent.ts
import { CodeGenerationResult, OutputResult } from '@/types/agent-interfaces';
import JSZip from 'jszip';

export class OutputPreviewAgent {
  private projectName: string;
  private onProgress?: (progress: number) => void;
  
  constructor(
    projectName: string,
    onProgress?: (progress: number) => void
  ) {
    this.projectName = projectName;
    this.onProgress = onProgress;
  }
  
  async execute(codeGeneration: CodeGenerationResult): Promise<OutputResult> {
    try {
      this.updateProgress(5);
      
      // Generate file structure for the Angular project
      const projectStructure = this.createProjectStructure(codeGeneration);
      this.updateProgress(30);
      
      // Create ZIP file with all project files
      const downloadUrl = await this.createZipFile(projectStructure);
      this.updateProgress(70);
      
      // Generate a preview URL (in a real implementation, this would create a real preview)
      const previewUrl = this.createPreviewUrl(codeGeneration);
      this.updateProgress(100);
      
      return {
        projectStructure,
        preview: {
          url: previewUrl
        },
        downloadUrl
      };
    } catch (error) {
      console.error('Output Preview Agent error:', error);
      throw new Error(`Failed to prepare output: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  private updateProgress(progress: number) {
    if (this.onProgress) {
      this.onProgress(progress);
    }
  }
  
  private createProjectStructure(codeGeneration: CodeGenerationResult): Array<{ path: string; content: string }> {
    const projectStructure: Array<{ path: string; content: string }> = [];
    const components = codeGeneration.components || [];
    const styles = codeGeneration.styles || {};
    const project = codeGeneration.project || {};
    
    // Add core project files
    projectStructure.push(
      { path: 'package.json', content: this.generatePackageJson() },
      { path: 'angular.json', content: this.generateAngularJson() },
      { path: 'tsconfig.json', content: this.generateTsConfig() },
      { path: 'README.md', content: this.generateReadme() }
    );
    
    // Add main application files
    projectStructure.push(
      { path: 'src/index.html', content: this.generateIndexHtml() },
      { path: 'src/main.ts', content: this.generateMainTs() },
      { path: 'src/app/app.module.ts', content: project.appModule || 'export {}' },
      { path: 'src/app/app.component.ts', content: project.appComponent || 'export {}' },
      { path: 'src/app/app-routing.module.ts', content: project.routing || 'export {}' }
    );
    
    // Add style files
    projectStructure.push(
      { path: 'src/styles/variables.css', content: styles.variables || '' },
      { path: 'src/styles/global.css', content: styles.global || '' }
    );
    
    // Add component files
    components.forEach(component => {
      const baseDir = `src/app/components/${this.getKebabCase(component.name)}`;
      
      projectStructure.push(
        { 
          path: `${baseDir}/${this.getKebabCase(component.name)}.component.ts`, 
          content: component.files.componentTs || '' 
        },
        { 
          path: `${baseDir}/${this.getKebabCase(component.name)}.component.html`, 
          content: component.files.componentHtml || '' 
        },
        { 
          path: `${baseDir}/${this.getKebabCase(component.name)}.component.less`, 
          content: component.files.componentLess || '' 
        }
      );
      
      // Add module file if it exists
      if (component.files.moduleTs) {
        projectStructure.push({
          path: `${baseDir}/${this.getKebabCase(component.name)}.module.ts`,
          content: component.files.moduleTs
        });
      }
    });
    
    return projectStructure;
  }
  
  private async createZipFile(projectStructure: Array<{ path: string; content: string }>): Promise<string> {
    const zip = new JSZip();
    const rootFolder = zip.folder(this.projectName || 'eds-angular-app');
    
    // Add all files to the ZIP
    projectStructure.forEach(file => {
      rootFolder.file(file.path, file.content);
    });
    
    // Generate ZIP file as a Blob
    const blob = await zip.generateAsync({ type: 'blob' });
    
    // Create a download URL
    return URL.createObjectURL(blob);
  }
  
  private createPreviewUrl(codeGeneration: CodeGenerationResult): string {
    // In a real implementation, this would create a real preview environment
    // For now, we'll just return a mock URL or data URI with a simple preview
    
    // Generate a basic HTML preview
    const previewHtml = this.generatePreviewHtml(codeGeneration);
    
    // Create a data URI from the HTML
    return `data:text/html;charset=utf-8,${encodeURIComponent(previewHtml)}`;
  }
  
  private generatePackageJson(): string {
    return JSON.stringify({
      "name": this.projectName || "eds-angular-app",
      "version": "0.0.0",
      "scripts": {
        "ng": "ng",
        "start": "ng serve",
        "build": "ng build",
        "watch": "ng build --watch --configuration development",
        "test": "ng test"
      },
      "private": true,
      "dependencies": {
        "@angular/animations": "~13.0.0",
        "@angular/common": "~13.0.0",
        "@angular/compiler": "~13.0.0",
        "@angular/core": "~13.0.0",
        "@angular/forms": "~13.0.0",
        "@angular/platform-browser": "~13.0.0",
        "@angular/platform-browser-dynamic": "~13.0.0",
        "@angular/router": "~13.0.0",
        "@eds/angular": "^7.0.0",
        "@eds/vanilla": "^7.0.0",
        "rxjs": "~7.4.0",
        "tslib": "^2.3.0",
        "zone.js": "~0.11.4"
      },
      "devDependencies": {
        "@angular-devkit/build-angular": "~13.0.1",
        "@angular/cli": "~13.0.1",
        "@angular/compiler-cli": "~13.0.0",
        "@types/jasmine": "~3.10.0",
        "@types/node": "^12.11.1",
        "jasmine-core": "~3.10.0",
        "karma": "~6.3.0",
        "karma-chrome-launcher": "~3.1.0",
        "karma-coverage": "~2.0.3",
        "karma-jasmine": "~4.0.0",
        "karma-jasmine-html-reporter": "~1.7.0",
        "typescript": "~4.4.3"
      }
    }, null, 2);
  }
  
  private generateAngularJson(): string {
    return JSON.stringify({
      "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
      "version": 1,
      "newProjectRoot": "projects",
      "projects": {
        [this.projectName || "eds-angular-app"]: {
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
                "outputPath": "dist/" + (this.projectName || "eds-angular-app"),
                "index": "src/index.html",
                "main": "src/main.ts",
                "polyfills": "src/polyfills.ts",
                "tsConfig": "tsconfig.app.json",
                "assets": [
                  "src/favicon.ico",
                  "src/assets"
                ],
                "styles": [
                  "src/styles/global.css",
                  "src/styles/variables.css"
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
                  "fileReplacements": [
                    {
                      "replace": "src/environments/environment.ts",
                      "with": "src/environments/environment.prod.ts"
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
                  "browserTarget": (this.projectName || "eds-angular-app") + ":build:production"
                },
                "development": {
                  "browserTarget": (this.projectName || "eds-angular-app") + ":build:development"
                }
              },
              "defaultConfiguration": "development"
            },
            "extract-i18n": {
              "builder": "@angular-devkit/build-angular:extract-i18n",
              "options": {
                "browserTarget": (this.projectName || "eds-angular-app") + ":build"
              }
            },
            "test": {
              "builder": "@angular-devkit/build-angular:karma",
              "options": {
                "main": "src/test.ts",
                "polyfills": "src/polyfills.ts",
                "tsConfig": "tsconfig.spec.json",
                "karmaConfig": "karma.conf.js",
                "assets": [
                  "src/favicon.ico",
                  "src/assets"
                ],
                "styles": [
                  "src/styles/global.css",
                  "src/styles/variables.css"
                ],
                "scripts": []
              }
            }
          }
        }
      },
      "defaultProject": this.projectName || "eds-angular-app"
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
        "noImplicitReturns": true,
        "noFallthroughCasesInSwitch": true,
        "sourceMap": true,
        "declaration": false,
        "downlevelIteration": true,
        "experimentalDecorators": true,
        "moduleResolution": "node",
        "importHelpers": true,
        "target": "es2017",
        "module": "es2020",
        "lib": [
          "es2020",
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
  
  private generateReadme(): string {
    return `# ${this.projectName || 'EDS Angular App'}

This project was generated with the Figma to EDS Converter tool.

## Development server

Run \`ng serve\` for a dev server. Navigate to \`http://localhost:4200/\`. The application will automatically reload if you change any of the source files.`;
  }
}
