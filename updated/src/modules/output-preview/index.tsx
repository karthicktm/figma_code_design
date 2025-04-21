// src/modules/output-preview/index.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AgentStatus, useAppStore } from '@/store';
import { ProgressIndicator } from '@/components/progress-indicator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export function OutputPreviewModule() {
  const { 
    codeGeneration,
    outputPreview,
    runOutputPreviewAgent,
    resetOutputPreview,
    setProjectName,
    setActiveModule
  } = useAppStore();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('package');
  
  const { status, progress, error, result, projectName, downloadUrl } = outputPreview;
  const codeResult = codeGeneration.result;
  
  const handleStartProcess = async () => {
    try {
      setIsProcessing(true);
      if (codeResult) {
        await runOutputPreviewAgent(codeResult);
      }
    } catch (error) {
      console.error('Output preview failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const isRunning = status === AgentStatus.Running || isProcessing;
  const canStart = codeResult && !isRunning && status !== AgentStatus.Complete;
  
  // If we don't have dependencies, show a message
  if (!codeResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Output Preview</CardTitle>
          <CardDescription>
            Preview and download your generated Angular application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTitle>Prerequisites Required</AlertTitle>
            <AlertDescription>
              Please complete the Code Generation module first.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button onClick={() => setActiveModule('code-generation')}>
            Go to Code Generation
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Output Preview</CardTitle>
          <CardDescription>
            Preview and download your generated Angular application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Project Configuration */}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                placeholder="eds-angular-app"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                disabled={isRunning || status === AgentStatus.Complete}
              />
              <p className="text-xs text-gray-500">
                This name will be used for the generated Angular project
              </p>
            </div>
          </div>
          
          {/* Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Components</h3>
              <p className="text-sm text-gray-600">
                {codeResult.components?.length || 0} components to package
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Project Status</h3>
              <p className="text-sm text-gray-600">
                {status === AgentStatus.Complete 
                  ? 'Ready for download' 
                  : isRunning ? `Processing... ${progress}%` : 'Ready to build'}
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Download</h3>
              <p className="text-sm text-gray-600">
                {downloadUrl ? 'Available' : 'Not yet available'}
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
                onClick={resetOutputPreview}
              >
                Reset
              </Button>
              {downloadUrl && (
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                >
                  <a href={downloadUrl} download={`${projectName || 'eds-angular-app'}.zip`} className="flex items-center">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-4 w-4 mr-2" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
                      />
                    </svg>
                    Download Project
                  </a>
                </Button>
              )}
            </div>
          ) : (
            <Button
              onClick={handleStartProcess}
              disabled={!canStart}
            >
              {isRunning ? `Processing... ${progress}%` : 'Build Project'}
            </Button>
          )}
        </CardFooter>
      </Card>
      
      {/* Project Structure Preview */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Project Structure</CardTitle>
            <CardDescription>
              Generated Angular project structure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-sm whitespace-pre-wrap bg-gray-50 p-4 rounded-md overflow-auto max-h-96">
              {result.structure}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}