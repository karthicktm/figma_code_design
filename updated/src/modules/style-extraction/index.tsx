// src/modules/style-extraction/index.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AgentStatus, useAppStore } from '@/store';
import { ProgressIndicator } from '@/components/progress-indicator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StylesColorPanel } from './styles-color-panel';
import { StylesTypographyPanel } from './styles-typography-panel';
import { StylesSpacingPanel } from './styles-spacing-panel';
import { StylesShadowPanel } from './styles-shadow-panel';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ExtractedStyles } from '@/types/agent-interfaces';

export function StyleExtractionModule() {
  const { 
    designInput,
    componentRecognition,
    styleExtraction,
    runStyleExtractionAgent,
    resetStyleExtraction,
    setActiveModule
  } = useAppStore();
  
  const [activeTab, setActiveTab] = useState('colors');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { status, progress, error, result } = styleExtraction;
  const designResult = designInput.result;
  const componentResult = componentRecognition.result;
  
  const handleStartProcess = async () => {
    try {
      setIsProcessing(true);
      if (designResult && componentResult) {
        await runStyleExtractionAgent(designResult, componentResult);
      }
    } catch (error) {
      console.error('Style extraction failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const isRunning = status === AgentStatus.Running || isProcessing;
  const canStart = designResult && componentResult && !isRunning && status !== AgentStatus.Complete;
  
  // If we don't have dependencies, show a message
  if (!designResult || !componentResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Style Extraction</CardTitle>
          <CardDescription>
            Extract design tokens and styles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTitle>Prerequisites Required</AlertTitle>
            <AlertDescription>
              Please complete the Design Input and Component Recognition modules first.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => setActiveModule(
              !designResult ? 'design-input' : 
              !componentResult ? 'component-recognition' : 
              'design-input'
            )}
          >
            Go to {!designResult ? 'Design Input' : 
                 !componentResult ? 'Component Recognition' : 
                 'Design Input'}
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Style Extraction</CardTitle>
          <CardDescription>
            Extract design tokens and styles from your Figma design
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Components</h3>
              <p className="text-sm text-gray-600">
                {componentResult.components?.length || 0} components analyzed
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Colors</h3>
              <p className="text-sm text-gray-600">
                {(result?.colors?.length || 0) > 0 
                  ? `${result.colors.length} color tokens found` 
                  : 'Ready to extract'}
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Typography</h3>
              <p className="text-sm text-gray-600">
                {(result?.typography?.length || 0) > 0 
                  ? `${result.typography.length} typography tokens found` 
                  : 'Ready to extract'}
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Spacing & Shadows</h3>
              <p className="text-sm text-gray-600">
                {(result?.spacing?.length || 0) > 0 
                  ? `${result.spacing.length} spacing, ${result.shadows.length} shadow tokens` 
                  : 'Ready to extract'}
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
                onClick={resetStyleExtraction}
              >
                Reset
              </Button>
              <Button onClick={() => setActiveModule('code-generation')}>
                Continue to Code Generation
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleStartProcess}
              disabled={!canStart}
            >
              {isRunning ? `Processing... ${progress}%` : 'Extract Styles'}
            </Button>
          )}
        </CardFooter>
      </Card>
      
      {/* Display extracted styles when available */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Extracted Styles</CardTitle>
            <CardDescription>
              Design tokens and styles extracted from your design
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="colors">Colors</TabsTrigger>
                <TabsTrigger value="typography">Typography</TabsTrigger>
                <TabsTrigger value="spacing">Spacing</TabsTrigger>
                <TabsTrigger value="shadows">Shadows</TabsTrigger>
              </TabsList>
              
              <TabsContent value="colors" className="p-4">
                <StylesColorPanel colors={result.colors} />
              </TabsContent>
              
              <TabsContent value="typography" className="p-4">
                <StylesTypographyPanel typography={result.typography} />
              </TabsContent>
              
              <TabsContent value="spacing" className="p-4">
                <StylesSpacingPanel spacing={result.spacing} breakpoints={result.breakpoints} />
              </TabsContent>
              
              <TabsContent value="shadows" className="p-4">
                <StylesShadowPanel shadows={result.shadows} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}