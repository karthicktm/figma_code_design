// src/modules/asset-manager/index.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AgentStatus, useAppStore } from '@/store';
import { ProgressIndicator } from '@/components/progress-indicator';
import { AssetUploader } from '@/components/asset-uploader';

export function AssetManagerModule() {
  const { 
    designInput,
    assetManager, 
    runAssetManagerAgent,
    resetAssetManager,
    uploadAsset,
    setActiveModule
  } = useAppStore();
  
  const { status, progress, error, result, missingAssets } = assetManager;
  const designResult = designInput.result;
  
  const handleStartProcess = async () => {
    if (designResult) {
      await runAssetManagerAgent(designResult);
    }
  };
  
  const handleUploadAsset = async (assetType: 'images' | 'icons' | 'fonts', files: File[]) => {
    for (const file of files) {
      await uploadAsset(assetType, file);
    }
  };
  
  const isRunning = status === AgentStatus.Running;
  const canStart = designResult && status !== AgentStatus.Running && status !== AgentStatus.Complete;
  
  // If we don't have design input data, show a message
  if (!designResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Asset Manager</CardTitle>
          <CardDescription>
            Process and download design assets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-amber-50 border border-amber-200 rounded p-4 text-amber-800">
            <p className="font-medium">Design Input Required</p>
            <p className="mt-1 text-sm">Please complete the Design Input module first to extract design data.</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={() => setActiveModule('design-input')}>
            Go to Design Input
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Asset Manager</CardTitle>
          <CardDescription>
            Process and download design assets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Images to Process</h3>
              <p className="text-sm text-gray-600">
                {designResult.assets?.images?.length || 0} images found
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Potential Icons</h3>
              <p className="text-sm text-gray-600">
                {designResult.components?.filter(c => 
                  (c.width <= 64 && c.height <= 64) || 
                  c.name.toLowerCase().includes('icon')
                ).length || 0} icons detected
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Fonts</h3>
              <p className="text-sm text-gray-600">
                {designResult.assets?.fonts?.length || 0} unique fonts found
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
                onClick={resetAssetManager}
              >
                Reset
              </Button>
              <Button onClick={() => setActiveModule('component-recognition')}>
                Continue to Component Recognition
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleStartProcess}
              disabled={!canStart}
            >
              {isRunning ? 'Processing...' : 'Process Assets'}
            </Button>
          )}
        </CardFooter>
      </Card>
      
      {/* Missing Assets Section */}
      {status === AgentStatus.Complete && missingAssets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Missing Assets</CardTitle>
            <CardDescription>
              Some assets couldn't be automatically downloaded. Please upload them manually.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                      onUpload={(files) => handleUploadAsset(assetType as 'images' | 'icons' | 'fonts', files)}
                      missingAssets={assetsOfType.map(asset => asset.name)}
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Asset Results Section */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Processed Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium mb-2">Downloaded Images</h3>
                <p className="text-sm text-gray-600">
                  {result.downloadedAssets?.images?.length || 0} images processed
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium mb-2">Downloaded Icons</h3>
                <p className="text-sm text-gray-600">
                  {result.downloadedAssets?.icons?.length || 0} icons processed
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium mb-2">Processed Fonts</h3>
                <p className="text-sm text-gray-600">
                  {result.downloadedAssets?.fonts?.length || 0} fonts processed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}