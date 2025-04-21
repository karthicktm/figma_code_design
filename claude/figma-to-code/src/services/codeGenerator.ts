// src/services/codeGenerator.ts
import { EdsComponent } from './componentMapper';
import { Asset, EdsConfig } from '../context/DesignContext';


export interface GeneratedCode {
  appModule: string;
  appComponent: {
    ts: string;
    html: string;
    less: string;
  };
  signInComponent: {
    ts: string;
    html: string;
    less: string;
  };
  angularJson: string;
  packageJson: string;
  readme: string;
  assets: Asset[];

}

class CodeGenerator {
    generateAngularApplication(
        componentName: string, 
        edsComponents: EdsComponent[],
        edsConfig: EdsConfig,
        assets: Asset[]
      ): GeneratedCode {
        // Generate the sign-in component
        const signInComponentTs = this.generateComponentClass(componentName);
        const signInComponentHtml = this.generateTemplate(edsComponents);
        const signInComponentLess = this.generateStyles(edsComponents, edsConfig, assets);
        
        // Generate app module with EDS imports
        const appModule = this.generateAppModule(componentName);
        
        // Generate main app component
        const appComponent = {
            ts: this.generateAppComponentTs(),
            html: this.generateAppComponentHtml(),
            less: this.generateAppComponentLess(edsConfig)
          };
        
        // Generate configuration files
        const angularJson = this.generateAngularJson();
        const packageJson = this.generatePackageJson(edsConfig);
        const readme = this.generateReadme();
        
        // Return all generated code
        return {
          appModule,
          appComponent,
          signInComponent: {
            ts: signInComponentTs,
            html: signInComponentHtml,
            less: signInComponentLess
          },
          angularJson,
          packageJson,
          readme,
          assets
        };
      }
  
  private generateAppModule(componentName: string): string {
    // Convert to PascalCase
    const className = componentName.replace(/-([a-z])/g, (g) => g[1].toUpperCase()).replace(/^./, g => g.toUpperCase());
    
    return `import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { ${className}Component } from './${componentName}/${componentName}.component';

@NgModule({
  declarations: [
    AppComponent,
    ${className}Component
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
`;
  }
  
  private generateAppComponentTs(): string {
    return `import { Component } from '@angular/core';
  
  @Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.less']
  })
  export class AppComponent {
    title = 'EDS Angular Application';
  }
  `;
  }
  
  private generateAppComponentHtml(): string {
    return `<div class="app-container">
  <header class="app-header">
    <h1>{{ title }}</h1>
  </header>
  <main>
    <app-sign-in></app-sign-in>
  </main>
</div>
`;
  }
  
  private generateAppComponentLess(edsConfig: EdsConfig): string {
    return `@import "${edsConfig.path}/eds";

.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.app-header {
  margin-bottom: 30px;
  text-align: center;
}`;
  }
  
  private generateComponentClass(componentName: string): string {
    // Convert to PascalCase
    const className = componentName.replace(/-([a-z])/g, (g) => g[1].toUpperCase()).replace(/^./, g => g.toUpperCase());
    
    return `import { Component, OnInit } from '@angular/core';
  import { FormBuilder, FormGroup, Validators } from '@angular/forms';
  
  @Component({
    selector: 'app-${componentName}',
    templateUrl: './${componentName}.component.html',
    styleUrls: ['./${componentName}.component.less']
  })
  export class ${className}Component implements OnInit {
    signInForm!: FormGroup; // Using definite assignment assertion
    
    constructor(private fb: FormBuilder) { }
    
    ngOnInit(): void {
      this.signInForm = this.fb.group({
        username: ['', Validators.required],
        password: ['', Validators.required],
        rememberMe: [false]
      });
    }
    
    onSubmit(): void {
      if (this.signInForm.valid) {
        console.log('Form submitted', this.signInForm.value);
        // Add your sign-in logic here
      }
    }
  }`;
  }
  
  private generateTemplate(components: EdsComponent[]): string {
    // Generate HTML from the components
    return this.generateHtml(components);
  }
  
  private generateHtml(components: EdsComponent[]): string {
    let html = '';
    
    components.forEach(component => {
      html += this.generateComponentHtml(component);
    });
    
    // Wrap in a form with the reactive form binding
    return `<form [formGroup]="signInForm" (ngSubmit)="onSubmit()" class="sign-in-container">
  ${html}
</form>`;
  }
  
  private generateComponentHtml(component: EdsComponent): string {
    switch (component.type) {
      case 'TextFieldComponent':
        return this.generateTextFieldHtml(component);
      case 'ButtonComponent':
        return this.generateButtonHtml(component);
      case 'CheckboxComponent':
        return this.generateCheckboxHtml(component);
      case 'LinkComponent':
        return this.generateLinkHtml(component);
      case 'HeaderComponent':
        return this.generateHeaderHtml(component);
      case 'FooterComponent':
        return this.generateFooterHtml(component);
      case 'TextComponent':
        return this.generateTextHtml(component);
      case 'div':
      case 'form':
        return this.generateContainerHtml(component);
      default:
        return '';
    }
  }
  
  private generateTextFieldHtml(component: EdsComponent): string {
    const { label, placeholder, type, required } = component.properties;
    const formControlName = type === 'password' ? 'password' : 'username';
    
    let html = '<div class="form-element">\n';
    
    if (label) {
      html += `  <label ${required ? 'class="required"' : ''}>${label}</label>\n`;
    }
    
    html += `  <input type="${type}" placeholder="${placeholder}" formControlName="${formControlName}" class="fullwidth">\n`;
    html += '</div>\n';
    
    return html;
  }
  
  private generateButtonHtml(component: EdsComponent): string {
    const { label, variant } = component.properties;
    
    return `<button type="submit" class="btn ${variant}">${label}</button>\n`;
  }
  
  private generateCheckboxHtml(component: EdsComponent): string {
    const { label, defaultChecked } = component.properties;
    
    return `<div class="checkbox">
  <input type="checkbox" id="rememberMe" formControlName="rememberMe" ${defaultChecked ? 'checked' : ''}>
  <label for="rememberMe">${label}</label>
</div>\n`;
  }
  
  private generateLinkHtml(component: EdsComponent): string {
    const { label, href } = component.properties;
    
    return `<a href="${href || '#'}" class="link">${label}</a>\n`;
  }
  
  private generateHeaderHtml(component: EdsComponent): string {
    let html = '<header class="header">\n';
    
    if (component.children) {
      component.children.forEach(child => {
        html += this.generateComponentHtml(child);
      });
    }
    
    html += '</header>\n';
    
    return html;
  }
  
  private generateFooterHtml(component: EdsComponent): string {
    const { text } = component.properties;
    
    return `<footer class="footer">
  <p>${text}</p>
</footer>\n`;
  }
  
  private generateTextHtml(component: EdsComponent): string {
    const { text } = component.properties;
    
    return `<p>${text}</p>\n`;
  }
  
  private generateContainerHtml(component: EdsComponent): string {
    const { className } = component.properties;
    let html = `<div class="${className}">\n`;
    
    if (component.children) {
      component.children.forEach(child => {
        html += this.generateComponentHtml(child);
      });
    }
    
    html += '</div>\n';
    
    return html;
  }
  
  private generateStyles(
    components: EdsComponent[], 
    edsConfig: EdsConfig,
    assets: Asset[]
  ): string {
    // Generate LESS styles with EDS imports and asset references
    const fontFaces = assets
      .filter(asset => asset.type === 'font')
      .map(font => `@font-face {
  font-family: '${font.name.split('.')[0]}';
  src: url('~src/assets/fonts/${font.name}') format('woff2');
  font-weight: normal;
  font-style: normal;
}`)
      .join('\n\n');
    
    return `@import "${edsConfig.path}/eds";
${fontFaces ? '\n' + fontFaces + '\n' : ''}

.sign-in-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  max-width: 400px;
  margin: 0 auto;
}

.form-element {
  margin-bottom: 16px;
  width: 100%;
}

.checkbox {
  margin-bottom: 24px;
}

.btn {
  width: 100%;
  margin-bottom: 16px;
}

.link {
  text-align: center;
  display: block;
  margin-top: 16px;
}

.header {
  margin-bottom: 32px;
  text-align: center;
  
  .logo {
    background-image: url('/assets/images/logo.svg');
    width: 120px;
    height: 40px;
    margin: 0 auto;
  }
}

.footer {
  margin-top: 32px;
  text-align: center;
  font-size: 14px;
  color: #666;
}`;
  }
  
  private generateAngularJson(): string {
    return `{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "newProjectRoot": "projects",
  "projects": {
    "eds-angular-app": {
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
            "outputPath": "dist/eds-angular-app",
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
              "browserTarget": "eds-angular-app:build:production"
            },
            "development": {
              "browserTarget": "eds-angular-app:build:development"
            }
          },
          "defaultConfiguration": "development"
        },
        "extract-i18n": {
          "builder": "@angular-devkit/build-angular:extract-i18n",
          "options": {
            "browserTarget": "eds-angular-app:build"
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
}`;
  }
  
  private generatePackageJson(edsConfig: EdsConfig): string {
    return `{
  "name": "eds-angular-app",
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
    "@angular/animations": "^16.0.0",
    "@angular/common": "^16.0.0",
    "@angular/compiler": "^16.0.0",
    "@angular/core": "^16.0.0",
    "@angular/forms": "^16.0.0",
    "@angular/platform-browser": "^16.0.0",
    "@angular/platform-browser-dynamic": "^16.0.0",
    "@angular/router": "^16.0.0",
    "${edsConfig.path}": "${edsConfig.version}",
    "rxjs": "~7.8.0",
    "tslib": "^2.3.0",
    "zone.js": "~0.13.0"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^16.0.0",
    "@angular/cli": "~16.0.0",
    "@angular/compiler-cli": "^16.0.0",
    "@types/jasmine": "~4.3.0",
    "jasmine-core": "~4.6.0",
    "karma": "~6.4.0",
    "karma-chrome-launcher": "~3.2.0",
    "karma-coverage": "~2.2.0",
    "karma-jasmine": "~5.1.0",
    "karma-jasmine-html-reporter": "~2.0.0",
    "typescript": "~5.0.2"
  }
}`;
  }
  
  private generateReadme(): string {
    return `# EDS Angular Application

This Angular application was automatically generated from a Figma design using the Figma-to-Code converter tool.

## Getting Started

1. Install dependencies:
   \`\`\`
   npm install
   \`\`\`

2. Start the development server:
   \`\`\`
   npm start
   \`\`\`

3. Open your browser to http://localhost:4200

## Application Structure

- \`src/app/app.component.*\`: The main application component
- \`src/app/sign-in/sign-in.component.*\`: The sign-in form component converted from Figma
- \`src/app/app.module.ts\`: Angular module with necessary imports

## EDS Integration

This application uses the Ericsson Design System (EDS) for styling and components. The EDS library is included as a dependency in package.json.

## Customization

Feel free to modify the generated code to suit your needs. This is a starting point based on your Figma design.
`;
  }
}

export default new CodeGenerator();