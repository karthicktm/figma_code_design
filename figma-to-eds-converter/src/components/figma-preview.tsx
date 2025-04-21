import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FigmaClient } from '@/lib/figma-api';

interface FigmaPreviewProps {
  fileId: string;
  apiKey: string;
  nodeId?: string;
}

export function FigmaPreview({ fileId, apiKey, nodeId }: FigmaPreviewProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  
  useEffect(() => {
    if (!fileId || !apiKey) {
      setError('File ID and API key are required');
      setLoading(false);
      return;
    }
    
    const fetchFigmaPreview = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const parsedFileId = fileId.includes('figma.com') 
          ? fileId.split('/').pop()?.split('?')[0] 
          : fileId;
          
        if (!parsedFileId) {
          throw new Error('Invalid Figma file URL or ID');
        }
        
        const figmaClient = new FigmaClient(apiKey);
        
        const file = await figmaClient.getFile(parsedFileId);
        setFileName(file.name);
        
        const targetNodeId = nodeId || findFirstFrameId(file.document);
        
        if (!targetNodeId) {
          throw new Error('No frames found in the Figma file');
        }
        
        const imageResponse = await figmaClient.getImageFills(
          parsedFileId, 
          [targetNodeId],
          'png', 
          2
        );
        
        if (imageResponse.err) {
          throw new Error(imageResponse.err);
        }
        
        const url = imageResponse.images[targetNodeId];
        setImageUrl(url);
        
      } catch (err) {
        console.error('Error fetching Figma preview:', err);
        setError(err instanceof Error ? err.message : 'Failed to load Figma preview');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFigmaPreview();
  }, [fileId, apiKey, nodeId]);
  
  const findFirstFrameId = (node: any): string | null => {
    if (node.type === 'FRAME' || node.type === 'COMPONENT') {
      return node.id;
    }
    
    if (node.children) {
      for (const child of node.children) {
        const frameId = findFirstFrameId(child);
        if (frameId) return frameId;
      }
    }
    
    return null;
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          {fileName || 'Figma Preview'}
        </CardTitle>
        <CardDescription>
          Preview of your Figma design
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex justify-center items-center min-h-[300px]">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        )}
        
        {error && !loading && (
          <div className="p-4 rounded-lg bg-destructive/10 text-destructive">
            <div className="flex flex-col items-center space-y-2">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                />
              </svg>
              <p className="text-sm font-medium text-center">{error}</p>
            </div>
          </div>
        )}
        
        {imageUrl && !loading && !error && (
          <div className="overflow-hidden rounded-lg border bg-card">
            <div className="relative aspect-[16/9] overflow-hidden">
              <img 
                src={imageUrl}
                alt={`Figma preview for ${fileName}`}
                className="object-contain w-full h-full"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}