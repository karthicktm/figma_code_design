'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WorkflowVisualizer } from '@/components/workflow-visualizer';
import { AssetUploader } from '@/components/asset-uploader';
import { FigmaPreview } from '@/components/figma-preview';
import { CodePreview } from '@/components/code-preview';
import { useAppStore, AppStatus, MissingAsset } from '@/store';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Home() {
  const [activeTab, setActiveTab] = useState('input');
  
  // Get state from the store
  const {
    figmaApiKey,
    figmaFileId,
    azureEndpoint,
    azureApiKey,
    azureDeploymentName,
    projectName,
    status,
    workflowSteps,
    error,
    figmaPreviewUrl,
    missingAssets,
    generatedCode,
    downloadUrl,
    setFigmaApiKey,
    setFigmaFileId,
    setAzureEndpoint,
    setAzureApiKey,
    setAzureDeploymentName,
    setProjectName,
    startWorkflow,
    uploadAsset,
    resetWorkflow
  } = useAppStore();
  
  // Auto-switch to the appropriate tab based on status
  useEffect(() => {
    switch (status) {
      case AppStatus.ProcessingInput:
      case AppStatus.ProcessingAssets:
      case AppStatus.RecognizingComponents:
      case AppStatus.ExtractingStyles:
      case AppStatus.GeneratingCode:
      case AppStatus.PreparingOutput:
        setActiveTab('workflow');
        break;
      case AppStatus.Error:
        // Stay on current tab but show error
        break;
      case AppStatus.Complete:
        if (missingAssets.length > 0) {
          setActiveTab('assets');
        } else {
          setActiveTab('output');
        }
        break;
    }
  }, [status, missingAssets.length]);
  
  const handleStartConversion = async () => {
    await startWorkflow();
  };
  
  const isProcessing = 
    status === AppStatus.ProcessingInput ||
    status === AppStatus.ProcessingAssets ||
    status === AppStatus.RecognizingComponents ||
    status === AppStatus.ExtractingStyles ||
    status === AppStatus.GeneratingCode ||
    status === AppStatus.PreparingOutput;
  
  const handleAssetUpload = async (assetType: 'images' | 'icons' | 'fonts', files: File[]) => {
    for (const file of files) {
      await uploadAsset(assetType, file);
    }
  };
  
  const getStatusText = () => {
    switch(status) {
      case AppStatus.ProcessingInput:
        return 'Processing Figma design...';
      case AppStatus.ProcessingAssets:
        return 'Processing assets...';
      case AppStatus.RecognizingComponents:
        return 'Recognizing components...';
      case AppStatus.ExtractingStyles:
        return 'Extracting styles...';
      case AppStatus.GeneratingCode:
        return 'Generating Angular code...';
      case AppStatus.PreparingOutput:
        return 'Preparing output...';
      case AppStatus.Complete:
        return 'Conversion complete!';
      case AppStatus.Error:
        return 'Error occurred';
      default:
        return '';
    }
  };
  
  return (
    <main className="container mx-auto py-8 px-4">
      <div className="flex flex-col space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Figma to EDS Angular Converter</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Convert your Figma designs to Angular components using the Ericsson Design System (EDS)
          </p>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {status !== AppStatus.Idle && (
          <div className="flex items-center justify-center text-sm font-medium">
            <div className="flex items-center">
              {isProcessing && (
                <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-primary rounded-full"></div>
              )}
              <span>{getStatusText()}</span>
            </div>
          </div>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-8">
            <TabsTrigger value="input">Input</TabsTrigger>
            <TabsTrigger value="workflow">Workflow</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="output">Output</TabsTrigger>
          </TabsList>
          
          <TabsContent value="input" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Design Input</CardTitle>
                <CardDescription>
                  Enter your Figma file details to start the conversion process
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="figma-api-key">Figma API Key</Label>
                    <Input 
                      id="figma-api-key" 
                      type="password" 
                      placeholder="Enter your Figma API key" 
                      value={figmaApiKey}
                      onChange={(e) => setFigmaApiKey(e.target.value)}
                      disabled={isProcessing}
                    />
                    <p className="text-xs text-gray-500">
                      You can create a personal access token in your Figma account settings
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="figma-file-id">Figma File URL or ID</Label>
                    <Input 
                      id="figma-file-id" 
                      placeholder="Enter Figma file URL or ID" 
                      value={figmaFileId}
                      onChange={(e) => setFigmaFileId(e.target.value)}
                      disabled={isProcessing}
                    />
                    <p className="text-xs text-gray-500">
                      Example: https://www.figma.com/file/abcdef123456/My-Design or abcdef123456
                    </p>
                  </div>
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <CardTitle className="text-lg mb-4">Azure OpenAI Settings</CardTitle>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="azure-endpoint">Azure OpenAI Endpoint</Label>
                      <Input 
                        id="azure-endpoint" 
                        placeholder="https://your-resource.openai.azure.com/" 
                        value={azureEndpoint}
                        onChange={(e) => setAzureEndpoint(e.target.value)}
                        disabled={isProcessing}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="azure-api-key">Azure OpenAI API Key</Label>
                      <Input 
                        id="azure-api-key" 
                        type="password"
                        placeholder="Enter your Azure OpenAI API key" 
                        value={azureApiKey}
                        onChange={(e) => setAzureApiKey(e.target.value)}
                        disabled={isProcessing}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="azure-deployment">Azure Deployment Name</Label>
                      <Input 
                        id="azure-deployment" 
                        placeholder="gpt-4" 
                        value={azureDeploymentName}
                        onChange={(e) => setAzureDeploymentName(e.target.value)}
                        disabled={isProcessing}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="project-name">Project Name</Label>
                      <Input 
                        id="project-name" 
                        placeholder="eds-angular-app" 
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        disabled={isProcessing}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleStartConversion} 
                  disabled={isProcessing || !figmaApiKey || !figmaFileId || !azureEndpoint || !azureApiKey}
                  className="w-full"
                >
                  {isProcessing ? 'Processing...' : 'Start Conversion'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="workflow">
            {workflowSteps.length > 0 ? (
              <WorkflowVisualizer steps={workflowSteps} />
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <h3 className="text-xl font-medium">No workflow in progress</h3>
                <p className="text-gray-500 mt-2">
                  Start a conversion from the Input tab to view the workflow progress.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="assets">
            {missingAssets.length > 0 ? (
              <div className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Missing Assets</CardTitle>
                    <CardDescription>
                      Some assets couldn't be automatically downloaded. Please upload them manually.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Group assets by type */}
                      {['images', 'icons', 'fonts'].map(assetType => {
                        const assetsOfType = missingAssets.filter(
                          asset => asset.type === assetType
                        );
                        
                        if (assetsOfType.length === 0) return null;
                        
                        return (
                          <div key={assetType}>
                            <AssetUploader 
                              assetType={assetType as 'images' | 'icons' | 'fonts'} 
                              onUpload={(files) => handleAssetUpload(assetType as 'images' | 'icons' | 'fonts', files)}
                              missingAssets={assetsOfType.map(asset => asset.name)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => setActiveTab('workflow')}>
                      Back to Workflow
                    </Button>
                    <Button onClick={() => setActiveTab('output')}>
                      Continue to Output
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <h3 className="text-xl font-medium">No Missing Assets</h3>
                <p className="text-gray-500 mt-2">
                  All assets were successfully processed.
                </p>
                <Button className="mt-6" onClick={() => setActiveTab('output')}>
                  Continue to Output
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="output">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <FigmaPreview 
                  fileId={figmaFileId} 
                  apiKey={figmaApiKey} 
                />
              </div>
              
              <div className="space-y-6">
                <CodePreview 
                  components={generatedCode?.components.map(component => ({
                    name: component.name,
                    files: component.files
                  }))}
                  projectFiles={[
                    {
                      name: 'variables.less',
                      content: generatedCode?.styles.variables || '',
                      language: 'less'
                    },
                    {
                      name: 'global.less',
                      content: generatedCode?.styles.global || '',
                      language: 'less'
                    },
                    {
                      name: 'app.module.ts',
                      content: generatedCode?.project.appModule || '',
                      language: 'typescript'
                    }
                  ]}
                />
                
                {downloadUrl && status === AppStatus.Complete && (
                  <div className="flex justify-center">
                    <a 
                      href={downloadUrl} 
                      download={`${projectName}.zip`}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                    >
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
                      Download Angular Project
                    </a>
                  </div>
                )}
              </div>
            </div>
            
            {status === AppStatus.Complete && (
              <div className="mt-8 flex justify-center">
                <Button onClick={resetWorkflow} variant="outline">
                  Start New Conversion
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
import { FigmaPreview } from '@/components/figma-preview';
import { CodePreview } from '@/components/code-preview';
import { useAppStore, AppStatus, MissingAsset } from '@/store';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Home() {
  const [activeTab, setActiveTab] = useState('input');
  
  // Get state from the store
  const {
    figmaApiKey,
    figmaFileId,
    azureEndpoint,
    azureApiKey,
    azureDeploymentName,
    projectName,
    status,
    workflowSteps,
    error,
    figmaPreviewUrl,
    missingAssets,
    generatedCode,
    downloadUrl,
    setFigmaApiKey,
    setFigmaFileId,