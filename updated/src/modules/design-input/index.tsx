// src/modules/design-input/index.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AgentStatus, useAppStore } from '@/store';
import { ProgressIndicator } from '@/components/progress-indicator';

export function DesignInputModule() {
  const { 
    designInput, 
    setDesignInputApiKey, 
    setDesignInputFileId, 
    runDesignInputAgent,
    resetDesignInput
  } = useAppStore();
  
  const { apiKey, fileId, status, progress, error, result } = designInput;
  
  const handleStartProcess = async () => {
    await runDesignInputAgent();
  };
  
  const isRunning = status === AgentStatus.Running;
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Design Input</CardTitle>
          <CardDescription>
            Extract components, styles and assets from your Figma design
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="figma-api-key">Figma API Key</Label>
              <Input 
                id="figma-api-key" 
                type="password" 
                value={apiKey}
                onChange={(e) => setDesignInputApiKey(e.target.value)}
                placeholder="Enter your Figma API key"
                disabled={isRunning || status === AgentStatus.Complete}
              />
              <p className="text-xs text-gray-500">
                You can create a personal access token in your Figma account settings
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="figma-file-id">Figma File URL or ID</Label>
              <Input 
                id="figma-file-id" 
                value={fileId}
                onChange={(e) => setDesignInputFileId(e.target.value)}
                placeholder="Enter Figma file URL or ID"
                disabled={isRunning || status === AgentStatus.Complete}
              />
              <p className="text-xs text-gray-500">
                Example: https://www.figma.com/file/abcdef123456/My-Design or abcdef123456
              </p>
            </div>
          </div>
          
          <ProgressIndicator 
            status={status} 
            progress={progress} 
            error={error} 
          />
        </CardContent>
        <CardFooter className="flex justify-between">
          {status === AgentStatus.Complete ? (
            <div className="flex space-x-4">
              <Button 
                variant="outline" 
                onClick={resetDesignInput}
              >
                Start Over
              </Button>
              <Button>
                Continue to Asset Manager
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleStartProcess}
              disabled={isRunning || !apiKey || !fileId}
            >
              {isRunning ? 'Processing...' : 'Extract Design Data'}
            </Button>
          )}
        </CardFooter>
      </Card>
      
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Extracted Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium mb-2">Components</h3>
                <p className="text-sm text-gray-600">
                  {result.components?.length || 0} components found
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium mb-2">Images</h3>
                <p className="text-sm text-gray-600">
                  {result.assets?.images?.length || 0} images found
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium mb-2">Fonts</h3>
                <p className="text-sm text-gray-600">
                  {result.assets?.fonts?.length || 0} unique fonts found
                </p>
              </div>
            </div>
            
            {result.figmaFile && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">File Details</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm"><span className="font-medium">Name:</span> {result.figmaFile.name}</p>
                  <p className="text-sm"><span className="font-medium">Last Modified:</span> {new Date(result.figmaFile.lastModified).toLocaleString()}</p>
                  <p className="text-sm"><span className="font-medium">Version:</span> {result.figmaFile.version}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}