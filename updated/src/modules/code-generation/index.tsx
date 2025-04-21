// src/modules/code-generation/index.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AgentStatus, useAppStore } from '@/store';
import { ProgressIndicator } from '@/components/progress-indicator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ComponentSelector } from './component-selector';

export function CodeGenerationModule() {
  const { 
    componentRecognition,
    styleExtraction,
    codeGeneration,
    runCodeGenerationAgent,
    resetCodeGeneration,
    setCodeGenAzureEndpoint,
    setCodeGenApiKey,
    setCodeGenDeploymentName,
    setActiveModule
  } = useAppStore();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('configuration');
  
  const { status, progress, error, result, azureEndpoint, apiKey, deploymentName } = codeGeneration;
  const componentResult = componentRecognition.result;
  const styleResult = styleExtraction.result;
  
  const handleStartProcess = async () => {
    try {
      setIsProcessing(true);
      if (componentResult && styleResult) {
        // Check if Azure OpenAI credentials are provided
        if (!azureEndpoint || !apiKey) {
          throw new Error('Azure OpenAI endpoint and API key are required');
        }
        
        await runCodeGenerationAgent(componentResult, styleResult);
      }
    } catch (error) {
      console.error('Code generation failed:', error);
      // Set error display for immediate feedback
      if (error instanceof Error) {
        // We don't directly modify the store state here since we're handling errors in the store action
        // This is just for UI feedback
      }
    } finally {
      setIsProcessing(false);
    }
  };
  
  const isRunning = status === AgentStatus.Running || isProcessing;
  const canStart = componentResult && styleResult && azureEndpoint && apiKey && !isRunning && status !== AgentStatus.Complete;
  
  // If we don't have dependencies, show a message
  if (!componentResult || !styleResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Code Generation</CardTitle>
          <CardDescription>
            Generate Angular components from your design
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTitle>Prerequisites Required</AlertTitle>
            <AlertDescription>
              Please complete the Component Recognition and Style Extraction modules first.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => setActiveModule(
              !componentResult ? 'component-recognition' : 
              !styleResult ? 'style-extraction' : 
              'component-recognition'
            )}
          >
            Go to {!componentResult ? 'Component Recognition' : 
                 !styleResult ? 'Style Extraction' : 
                 'Component Recognition'}
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Code Generation</CardTitle>
          <CardDescription>
            Generate Angular components from your design using Azure OpenAI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="configuration">Configuration</TabsTrigger>
              <TabsTrigger value="component">Component Selection</TabsTrigger>
            </TabsList>
            
            <TabsContent value="configuration">
              {/* Azure OpenAI Configuration */}
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="azure-endpoint">Azure OpenAI Endpoint</Label>
                  <Input
                    id="azure-endpoint"
                    placeholder="https://your-resource.openai.azure.com"
                    value={azureEndpoint}
                    onChange={(e) => setCodeGenAzureEndpoint(e.target.value)}
                    disabled={isRunning || status === AgentStatus.Complete}
                  />
                  <p className="text-xs text-gray-500">
                    Example: https://myopenai.openai.azure.com
                  </p>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="api-key">API Key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="Your Azure OpenAI API key"
                    value={apiKey}
                    onChange={(e) => setCodeGenApiKey(e.target.value)}
                    disabled={isRunning || status === AgentStatus.Complete}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="deployment">Deployment Name</Label>
                  <Input
                    id="deployment"
                    placeholder="gpt-4"
                    value={deploymentName}
                    onChange={(e) => setCodeGenDeploymentName(e.target.value)}
                    disabled={isRunning || status === AgentStatus.Complete}
                  />
                  <p className="text-xs text-gray-500">
                    The model deployment name in your Azure OpenAI resource (e.g., gpt-4, gpt-35-turbo)
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="component">
              <ComponentSelector 
                componentsList={componentResult?.components || []}
                onSelectNode={setSelectedNodeId}
              />
            </TabsContent>
          </Tabs>
          
          {/* Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Components</h3>
              <p className="text-sm text-gray-600">
                {selectedNodeId 
                  ? '1 component selected for generation'
                  : `${componentResult.components?.length || 0} components to generate`}
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Styles</h3>
              <p className="text-sm text-gray-600">
                {styleResult.colors?.length || 0} colors, {styleResult.typography?.length || 0} typography styles
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Generation Status</h3>
              <p className="text-sm text-gray-600">
                {status === AgentStatus.Complete 
                  ? `${result?.components?.length || 0} components generated` 
                  : isRunning ? `Processing... ${progress}%` : 'Ready to generate'}
              </p>
            </div>
          </div>
          
          <ProgressIndicator 
            status={status} 
            progress={progress} 
            error={error}
            isProcessing={isProcessing} 
          />
          
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {status === AgentStatus.Complete ? (
            <div className="flex space-x-4">
              <Button 
                variant="outline" 
                onClick={resetCodeGeneration}
              >
                Reset
              </Button>
              <Button onClick={() => setActiveModule('output-preview')}>
                Continue to Output Preview
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleStartProcess}
              disabled={!canStart}
            >
              {isRunning ? `Processing... ${progress}%` : 'Generate Code'}
            </Button>
          )}
        </CardFooter>
      </Card>
      
      {/* Generated Code Preview */}
      {result && result.components && result.components.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Components</CardTitle>
            <CardDescription>
              {result.components.length} Angular components have been generated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="components">
              <TabsList>
                <TabsTrigger value="components">Components</TabsTrigger>
                <TabsTrigger value="styles">Styles</TabsTrigger>
                <TabsTrigger value="project">Project Files</TabsTrigger>
              </TabsList>
              
              <TabsContent value="components" className="mt-4 space-y-4">
                {result.components.map((component: any, index: number) => (
                  <div key={index} className="border rounded-md p-4">
                    <h4 className="font-medium">{component.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Type: {component.edsComponentType || 'Component'}
                    </p>
                    
                    <div className="mt-2">
                      <Label className="text-xs text-gray-500">Files:</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                        <div className="text-xs bg-gray-100 p-2 rounded">
                          component.ts
                        </div>
                        <div className="text-xs bg-gray-100 p-2 rounded">
                          component.html
                        </div>
                        <div className="text-xs bg-gray-100 p-2 rounded">
                          component.less
                        </div>
                        {component.files.moduleTs && (
                          <div className="text-xs bg-gray-100 p-2 rounded">
                            module.ts
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <Label className="text-xs text-gray-500">Dependencies:</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {component.dependencies?.map((dep: string, i: number) => (
                          <span key={i} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {dep}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="styles" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium mb-2">CSS Variables</h4>
                    <div className="bg-gray-50 p-3 rounded text-sm font-mono h-40 overflow-y-auto">
                      <pre className="whitespace-pre-wrap">
                        {result.styles?.variables ? result.styles.variables.substring(0, 500) + '...' : 'No variables generated'}
                      </pre>
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium mb-2">Global Styles</h4>
                    <div className="bg-gray-50 p-3 rounded text-sm font-mono h-40 overflow-y-auto">
                      <pre className="whitespace-pre-wrap">
                        {result.styles?.global ? result.styles.global.substring(0, 500) + '...' : 'No global styles generated'}
                      </pre>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="project" className="mt-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium mb-2">App Module</h4>
                    <div className="bg-gray-50 p-3 rounded text-sm font-mono h-40 overflow-y-auto">
                      <pre className="whitespace-pre-wrap">
                        {result.project?.appModule || 'No module file generated'}
                      </pre>
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium mb-2">App Component</h4>
                    <div className="bg-gray-50 p-3 rounded text-sm font-mono h-40 overflow-y-auto">
                      <pre className="whitespace-pre-wrap">
                        {result.project?.appComponent || 'No component file generated'}
                      </pre>
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium mb-2">Routing</h4>
                    <div className="bg-gray-50 p-3 rounded text-sm font-mono h-40 overflow-y-auto">
                      <pre className="whitespace-pre-wrap">
                        {result.project?.routing || 'No routing file generated'}
                      </pre>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}