// src/modules/component-recognition/index.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AgentStatus, useAppStore } from '@/store';
import { ProgressIndicator } from '@/components/progress-indicator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ComponentViewer } from './component-viewer';
import { RecognizedComponentsList } from './recognized-components-list';
import { DesignInputResult, AssetManagerResult } from '@/types/agent-interfaces';

export function ComponentRecognitionModule() {
  const { 
    designInput,
    assetManager,
    componentRecognition,
    runComponentRecognitionAgent,
    resetComponentRecognition,
    setActiveModule
  } = useAppStore();
  
  const [activeView, setActiveView] = useState('list');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { status, progress, error, result } = componentRecognition;
  const designResult = designInput.result as DesignInputResult;
  const assetResult = assetManager.result as AssetManagerResult;
  
  const handleStartProcess = async () => {
    try {
      setIsProcessing(true);
      if (designResult && assetResult) {
        await runComponentRecognitionAgent({ designInput: designResult, assetManager: assetResult });
      }
    } catch (error) {
      console.error('Component recognition failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const isRunning = status === AgentStatus.Running || isProcessing;
  const canStart = designResult && assetResult && !isRunning && status !== AgentStatus.Complete;
  
  // If we don't have dependencies, show a message
  if (!designResult || !assetResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Component Recognition</CardTitle>
          <CardDescription>
            Identify UI components in your design
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-amber-50 border border-amber-200 rounded p-4 text-amber-800">
            <p className="font-medium">Prerequisites Required</p>
            <p className="mt-1 text-sm">Please complete the Design Input and Asset Manager modules first.</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={() => setActiveModule(designResult ? 'asset-manager' : 'design-input')}>
            Go to {designResult ? 'Asset Manager' : 'Design Input'}
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Component Recognition</CardTitle>
          <CardDescription>
            Identify and categorize UI components in your design
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Design Elements</h3>
              <p className="text-sm text-gray-600">
                {designResult.components?.length || 0} elements to analyze
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Assets</h3>
              <p className="text-sm text-gray-600">
                {assetResult.downloadedAssets?.images?.length || 0} images, {assetResult.downloadedAssets?.icons?.length || 0} icons
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Recognition Status</h3>
              <p className="text-sm text-gray-600">
                {status === AgentStatus.Complete 
                  ? `${result?.components?.length || 0} components identified` 
                  : isRunning ? `Processing... ${progress}%` : 'Ready to process'}
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
            <div className="bg-red-50 border border-red-200 rounded p-4 text-red-800">
              <p className="font-medium">Error</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {status === AgentStatus.Complete ? (
            <div className="flex space-x-4">
              <Button 
                variant="outline" 
                onClick={resetComponentRecognition}
              >
                Reset
              </Button>
              <Button onClick={() => setActiveModule('style-extraction')}>
                Continue to Style Extraction
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleStartProcess}
              disabled={!canStart}
            >
              {isRunning ? `Processing... ${progress}%` : 'Identify Components'}
            </Button>
          )}
        </CardFooter>
      </Card>
      
      {/* Results Section */}
      {result && result.components && result.components.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recognized Components</CardTitle>
            <CardDescription>
              {result.components.length} components have been identified in your design
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="list">List View</TabsTrigger>
                <TabsTrigger value="visual">Visual View</TabsTrigger>
              </TabsList>
              
              <TabsContent value="list" className="mt-4">
                <RecognizedComponentsList components={result.components} />
              </TabsContent>
              
              <TabsContent value="visual" className="mt-4">
                <ComponentViewer components={result.components} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
      
      {/* Pages and Layouts */}
      {result && result.pages && result.pages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pages & Layouts</CardTitle>
            <CardDescription>
              Components organized by pages and layouts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Pages</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.pages.map((page: { name: string; components: any[] }, index: number) => (
                  <div key={index} className="border rounded-md p-4">
                    <h4 className="font-medium">{page.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {page.components?.length || 0} components
                    </p>
                  </div>
                ))}
              </div>
              
              <h3 className="text-lg font-medium mt-6">Layouts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.layouts.map((layout: { name: string; layoutType: string; components: any[] }, index: number) => (
                  <div key={index} className="border rounded-md p-4">
                    <h4 className="font-medium">{layout.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {layout.layoutType} layout with {layout.components?.length || 0} components
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}