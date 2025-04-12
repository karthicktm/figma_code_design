 // components/code-generation/code-preview.tsx
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { toast } from "sonner";
import { CodeGenerationResult } from '@/lib/types';

interface CodePreviewProps {
  generatedCode: CodeGenerationResult;
}

export function CodePreview({ generatedCode }: CodePreviewProps) {
  const [activeTab, setActiveTab] = useState<string>('');
  //const { toast } = useToast();
  
  // Initialize active tab when code changes
  React.useEffect(() => {
    if (generatedCode && generatedCode.components.length > 0) {
      // Find the first component with files
      const firstComponent = generatedCode.components[0];
      if (firstComponent && Object.keys(firstComponent.files).length > 0) {
        setActiveTab(Object.keys(firstComponent.files)[0]);
      }
    }
  }, [generatedCode]);
  
  // Get all files from components and layout
  const allFiles: Record<string, string> = {};
  
  if (generatedCode) {
    // Add component files
    generatedCode.components.forEach(component => {
      Object.entries(component.files).forEach(([filename, content]) => {
        const prefixedName = `${component.name}/${filename}`;
        allFiles[prefixedName] = content;
      });
    });
    
    // Add layout files if present
    if (generatedCode.layout) {
      Object.entries(generatedCode.layout.files).forEach(([filename, content]) => {
        const prefixedName = `Layout/${filename}`;
        allFiles[prefixedName] = content;
      });
    }
  }
  
  const handleCopy = (filename: string, content: string) => {
    navigator.clipboard.writeText(content)
      .then(() => {
        toast.success(`${filename} copied to clipboard.`);
      })
      .catch(() => {
        toast.error("Failed to copy to clipboard. Please try again.");
      });
  };
  
  if (!generatedCode || Object.keys(allFiles).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Code Generated</CardTitle>
          <CardDescription>
            Generate code first to preview it here.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Generated Code</CardTitle>
        <CardDescription>
          Preview the generated code for your components.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 flex flex-wrap">
            {Object.keys(allFiles).map((filename) => (
              <TabsTrigger key={filename} value={filename} className="mr-1 mb-1">
                {filename}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {Object.entries(allFiles).map(([filename, code]) => (
            <TabsContent key={filename} value={filename}>
              <div className="relative">
                <pre className="p-4 rounded-md bg-muted overflow-x-auto text-sm">
                  <code>{code}</code>
                </pre>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="absolute top-2 right-2"
                  onClick={() => handleCopy(filename, code)}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
