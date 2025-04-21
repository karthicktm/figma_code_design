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
  
  const { status, progress, error, result, azureEndpoint, apiKey, deploymentName } = codeGeneration;
  const componentResult = componentRecognition.result;
  const styleResult = styleExtraction.result;
  
  const handleStartProcess = async () => {
    try {
      setIsProcessing(true);
      if (componentResult && styleResult) {
        await runCodeGenerationAgent(componentResult, styleResult);
      }
    } catch (error) {
      console.error('Code generation failed:', error);
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
          {/* Azure OpenAI Configuration */}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="azure-endpoint">Azure OpenAI Endpoint</Label>
              <Input
                id="azure-endpoint"
                placeholder="https://your-resource.openai.azure.com"
                value={azureEndpoint}
                onChange={(e) => setCodeGenAzureEndpoint(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="Your Azure OpenAI API key"
                value={apiKey}
                onChange={(e) => setCodeGenApiKey(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="deployment">Deployment Name</Label>
              <Input
                id="deployment"
                placeholder="gpt-4"
                value={deploymentName}
                onChange={(e) => setCodeGenDeploymentName(e.target.value)}
              />
            </div>
          </div>
          
          {/* Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Components</h3>
              <p className="text-sm text-gray-600">
                {componentResult.components?.length || 0} components to generate
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
            <div className="space-y-4">
              {result.components.map((component: any, index: number) => (
                <div key={index} className="border rounded-md p-4">
                  <h4 className="font-medium">{component.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {component.files.length} files generated
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}