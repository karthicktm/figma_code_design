import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

interface FilePreviewProps {
  fileName: string;
  code: string;
  language: string;
}

function FilePreview({ fileName, code, language }: FilePreviewProps) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-700">{fileName}</h3>
        <Button 
          variant="outline"
          size="sm"
          onClick={() => {
            navigator.clipboard.writeText(code);
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
            />
          </svg>
          Copy
        </Button>
      </div>
      <div className="bg-gray-900 rounded-md overflow-hidden">
        <pre className="p-4 text-gray-100 text-sm overflow-x-auto">
          <code className={`language-${language}`}>
            {code}
          </code>
        </pre>
      </div>
    </div>
  );
}

interface ComponentPreviewProps {
  name: string;
  files: {
    componentTs: string;
    componentHtml: string;
    componentLess: string;
    moduleTs?: string;
  };
}

function ComponentPreview({ name, files }: ComponentPreviewProps) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-3">{name}</h2>
      <Tabs defaultValue="html">
        <TabsList className="mb-4">
          <TabsTrigger value="html">HTML</TabsTrigger>
          <TabsTrigger value="ts">TypeScript</TabsTrigger>
          <TabsTrigger value="less">LESS</TabsTrigger>
          {files.moduleTs && <TabsTrigger value="module">Module</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="html">
          <FilePreview
            fileName={`${name}.component.html`}
            code={files.componentHtml}
            language="html"
          />
        </TabsContent>
        
        <TabsContent value="ts">
          <FilePreview
            fileName={`${name}.component.ts`}
            code={files.componentTs}
            language="typescript"
          />
        </TabsContent>
        
        <TabsContent value="less">
          <FilePreview
            fileName={`${name}.component.less`}
            code={files.componentLess}
            language="less"
          />
        </TabsContent>
        
        {files.moduleTs && (
          <TabsContent value="module">
            <FilePreview
              fileName={`${name}.module.ts`}
              code={files.moduleTs}
              language="typescript"
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

interface ProjectFilesProps {
  files: {
    name: string;
    content: string;
    language: string;
  }[];
}

function ProjectFiles({ files }: ProjectFilesProps) {
  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-3">Project Files</h2>
      <div className="space-y-4">
        {files.map((file, index) => (
          <FilePreview
            key={index}
            fileName={file.name}
            code={file.content}
            language={file.language}
          />
        ))}
      </div>
    </div>
  );
}

interface CodePreviewProps {
  components?: ComponentPreviewProps[];
  projectFiles?: {
    name: string;
    content: string;
    language: string;
  }[];
}

export function CodePreview({ components = [], projectFiles = [] }: CodePreviewProps) {
  const [activeTab, setActiveTab] = useState('components');
  
  const hasContent = components.length > 0 || projectFiles.length > 0;
  
  if (!hasContent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Generated Code</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center text-gray-500">
            <p>No code has been generated yet.</p>
            <p className="text-sm">Complete the workflow to see the generated Angular code.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Generated Code</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="project">Project Files</TabsTrigger>
          </TabsList>
          
          <TabsContent value="components">
            {components.length > 0 ? (
              components.map((component, index) => (
                <ComponentPreview
                  key={index}
                  name={component.name}
                  files={component.files}
                />
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>No components have been generated yet.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="project">
            {projectFiles.length > 0 ? (
              <ProjectFiles files={projectFiles} />
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>No project files have been generated yet.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}