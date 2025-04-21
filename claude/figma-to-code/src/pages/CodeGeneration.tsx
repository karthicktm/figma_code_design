// src/pages/CodeGeneration.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { useDesignContext } from '../context/DesignContext';
import componentMapper from '../services/componentMapper';
import codeGenerator from '../services/codeGenerator';
import JSZip from 'jszip';

const Container = styled.div`
  max-width: 800px;
`;

const Title = styled.h1`
  font-size: 28px;
  margin-bottom: 8px;
  font-weight: 500;
`;

const Subtitle = styled.p`
  color: #666;
  margin-bottom: 30px;
`;

const TabsContainer = styled.div`
  display: flex;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 10px 20px;
  background-color: ${props => props.active ? '#fff' : '#f5f5f5'};
  border: 1px solid #ddd;
  border-bottom: ${props => props.active ? 'none' : '1px solid #ddd'};
  margin-right: 5px;
  margin-bottom: 5px;
  cursor: pointer;
  font-weight: ${props => props.active ? '500' : 'normal'};
  position: relative;
  bottom: -1px;
`;

const TabContent = styled.div`
  border: 1px solid #ddd;
  padding: 20px;
  background-color: #fff;
  overflow: auto;
`;

const CodeBlock = styled.pre`
  background-color: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
  overflow: auto;
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  margin-bottom: 20px;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
`;

const Button = styled.button`
  background-color: #000;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    background-color: #333;
  }
`;

const BackButton = styled(Button)`
  background-color: #f5f5f5;
  color: #333;
  
  &:hover {
    background-color: #e5e5e5;
  }
`;

const DownloadButton = styled(Button)`
  background-color: #4caf50;
  
  &:hover {
    background-color: #45a049;
  }
`;

const SubTitle = styled.h3`
  margin-top: 20px;
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: 500;
`;

const CodeGeneration: React.FC = () => {
  const navigate = useNavigate();
  const { figmaDocument, parsedComponents, edsConfig, assets } = useDesignContext();
  const [activeTab, setActiveTab] = useState('app-module');
  const [generatedCode, setGeneratedCode] = useState<{
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
    assets: Array<{
      type: 'font' | 'icon' | 'image';
      name: string;
      file: File | null;
    }>;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (parsedComponents && parsedComponents.length > 0 && figmaDocument) {
      setIsGenerating(true);
      // Map components and generate code
      const mappedComponents = componentMapper.mapComponents(parsedComponents);
      const componentName = 'sign-in';
      const code = codeGenerator.generateAngularApplication(
        componentName, 
        mappedComponents, 
        edsConfig, 
        assets
      );
      
      setGeneratedCode(code);
      setIsGenerating(false);
    } else {
      navigate('/');
    }
  }, [parsedComponents, figmaDocument, edsConfig, assets, navigate]);
  
const downloadCode = async () => {
  if (!generatedCode) return;
  
  try {
    const zip = new JSZip();
    
    // Create src folder structure
    const src = zip.folder("src")!;
    const app = src.folder("app")!;
    const signIn = app.folder("sign-in")!;
    
    // Create assets folders
    const assets = src.folder("assets")!;
    const fonts = assets.folder("fonts")!;
    const icons = assets.folder("icons")!;
    const images = assets.folder("images")!;
    
    // Add assets from the context
    for (const asset of generatedCode.assets) {
      if (asset.file) {
        const buffer = await asset.file.arrayBuffer();
        
        if (asset.type === 'font') {
          fonts.file(asset.name, buffer);
        } else if (asset.type === 'icon') {
          icons.file(asset.name, buffer);
        } else if (asset.type === 'image') {
          images.file(asset.name, buffer);
        }
      }
    }
    
    // Add app module
    app.file("app.module.ts", generatedCode.appModule);
    
    // Add app component files
    app.file("app.component.ts", generatedCode.appComponent.ts);
    app.file("app.component.html", generatedCode.appComponent.html);
    app.file("app.component.less", generatedCode.appComponent.less);
    
    // Add sign-in component files
    signIn.file("sign-in.component.ts", generatedCode.signInComponent.ts);
    signIn.file("sign-in.component.html", generatedCode.signInComponent.html);
    signIn.file("sign-in.component.less", generatedCode.signInComponent.less);
      
      // Add config files at root
      zip.file("angular.json", generatedCode.angularJson);
      zip.file("package.json", generatedCode.packageJson);
      zip.file("README.md", generatedCode.readme);
      
      // Add missing TypeScript configuration files
      zip.file("tsconfig.json", `{
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
  }`);
      
      zip.file("tsconfig.app.json", `{
    "extends": "./tsconfig.json",
    "compilerOptions": {
      "outDir": "./out-tsc/app",
      "types": []
    },
    "files": [
      "src/main.ts"
    ],
    "include": [
      "src/**/*.d.ts"
    ]
  }`);
      
      zip.file("tsconfig.spec.json", `{
    "extends": "./tsconfig.json",
    "compilerOptions": {
      "outDir": "./out-tsc/spec",
      "types": [
        "jasmine"
      ]
    },
    "include": [
      "src/**/*.spec.ts",
      "src/**/*.d.ts"
    ]
  }`);
      
      // Create basic index.html and main.ts files
      src.file("index.html", `<!doctype html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <title>EDS Angular App</title>
    <base href="/">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="icon" type="image/x-icon" href="favicon.ico">
  </head>
  <body>
    <app-root></app-root>
  </body>
  </html>
  `);
      
      src.file("main.ts", `import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
  import { AppModule } from './app/app.module';
  
  platformBrowserDynamic().bootstrapModule(AppModule)
    .catch(err => console.error(err));
  `);
      
      src.file("styles.less", `/* You can add global styles to this file, and also import other style files */
  @import "@eds/vanilla/eds";
  
  body {
    margin: 0;
    font-family: 'Ericsson Hilda', Arial, sans-serif;
  }
  `);
  
      // Add .gitignore file
      zip.file(".gitignore", `# See http://help.github.com/ignore-files/ for more about ignoring files.
  
  # Compiled output
  /dist
  /tmp
  /out-tsc
  /bazel-out
  
  # Node
  /node_modules
  npm-debug.log
  yarn-error.log
  
  # IDEs and editors
  .idea/
  .project
  .classpath
  .c9/
  *.launch
  .settings/
  *.sublime-workspace
  
  # Visual Studio Code
  .vscode/*
  !.vscode/settings.json
  !.vscode/tasks.json
  !.vscode/launch.json
  !.vscode/extensions.json
  .history/*
  
  # Miscellaneous
  /.angular/cache
  .sass-cache/
  /connect.lock
  /coverage
  /libpeerconnection.log
  testem.log
  /typings
  
  # System files
  .DS_Store
  Thumbs.db
  `);
  
      // Add environment files
      const environments = src.folder("environments")!;
      environments.file("environment.ts", `export const environment = {
    production: false
  };
  `);
      
      environments.file("environment.prod.ts", `export const environment = {
    production: true
  };
  `);
      
      // Generate the zip file
      const content = await zip.generateAsync({ type: "blob" });
      
      // Create download link
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = "eds-angular-app.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating zip file:', error);
    }
  };
  
  return (
    <Container>
      <Title>Code Generation</Title>
      <Subtitle>Review and download the generated Angular application with EDS integration.</Subtitle>
      
      {isGenerating ? (
        <div>Generating code...</div>
      ) : (
        <>
          <TabsContainer>
            <Tab 
              active={activeTab === 'app-module'} 
              onClick={() => setActiveTab('app-module')}
            >
              app.module.ts
            </Tab>
            <Tab 
              active={activeTab === 'app-component'} 
              onClick={() => setActiveTab('app-component')}
            >
              app.component.ts
            </Tab>
            <Tab 
              active={activeTab === 'sign-in-component'} 
              onClick={() => setActiveTab('sign-in-component')}
            >
              sign-in.component.ts
            </Tab>
            <Tab 
              active={activeTab === 'html'} 
              onClick={() => setActiveTab('html')}
            >
              HTML Templates
            </Tab>
            <Tab 
              active={activeTab === 'less'} 
              onClick={() => setActiveTab('less')}
            >
              LESS Styles
            </Tab>
            <Tab 
              active={activeTab === 'config'} 
              onClick={() => setActiveTab('config')}
            >
              Config Files
            </Tab>
          </TabsContainer>
          
          <TabContent>
            {generatedCode && (
              <>
                {activeTab === 'app-module' && (
                  <CodeBlock>{generatedCode.appModule}</CodeBlock>
                )}
                {activeTab === 'app-component' && (
                  <CodeBlock>{generatedCode.appComponent.ts}</CodeBlock>
                )}
                {activeTab === 'sign-in-component' && (
                  <CodeBlock>{generatedCode.signInComponent.ts}</CodeBlock>
                )}
                {activeTab === 'html' && (
                  <>
                    <SubTitle>app.component.html</SubTitle>
                    <CodeBlock>{generatedCode.appComponent.html}</CodeBlock>
                    <SubTitle>sign-in.component.html</SubTitle>
                    <CodeBlock>{generatedCode.signInComponent.html}</CodeBlock>
                  </>
                )}
                {activeTab === 'less' && (
                  <>
                    <SubTitle>app.component.less</SubTitle>
                    <CodeBlock>{generatedCode.appComponent.less}</CodeBlock>
                    <SubTitle>sign-in.component.less</SubTitle>
                    <CodeBlock>{generatedCode.signInComponent.less}</CodeBlock>
                  </>
                )}
                {activeTab === 'config' && (
                  <>
                    <SubTitle>angular.json</SubTitle>
                    <CodeBlock>{generatedCode.angularJson}</CodeBlock>
                    <SubTitle>package.json</SubTitle>
                    <CodeBlock>{generatedCode.packageJson}</CodeBlock>
                    <SubTitle>README.md</SubTitle>
                    <CodeBlock>{generatedCode.readme}</CodeBlock>
                  </>
                )}
              </>
            )}
          </TabContent>
          
          <ButtonGroup>
            <BackButton onClick={() => navigate('/component-mapping')}>
              Back
            </BackButton>
            <DownloadButton onClick={downloadCode}>
              Download Angular Application
            </DownloadButton>
          </ButtonGroup>
        </>
      )}
    </Container>
  );
};

export default CodeGeneration;