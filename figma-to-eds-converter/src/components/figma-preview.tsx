import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        
        // Extract fileId from URL if needed
        const parsedFileId = fileId.includes('figma.com') 
          ? fileId.split('/').pop()?.split('?')[0] 
          : fileId;
          
        if (!parsedFileId) {
          throw new Error('Invalid Figma file URL or ID');
        }
        
        const figmaClient = new FigmaClient(apiKey);
        
        // First get the file info
        const file = await figmaClient.getFile(parsedFileId);
        setFileName(file.name);
        
        // Get the nodeId to render - use the first frame if not specified
        const targetNodeId = nodeId || findFirstFrameId(file.document);
        
        if (!targetNodeId) {
          throw new Error('No frames found in the Figma file');
        }
        
        // Generate image
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
        setError(err.message || 'Failed to load Figma preview');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFigmaPreview();
  }, [fileId, apiKey, nodeId]);
  
  // Helper function to find the first frame in the document
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
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle>
          {fileName || 'Figma Preview'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex justify-center items-center min-h-[300px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {error && !loading && (
          <div className="p-4 bg-red-50 border border-red-200 rounded text-center min-h-[200px] flex items-center justify-center">
            <div>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6 text-red-500 mx-auto mb-2" 
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
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          </div>
        )}
        
        {imageUrl && !loading && !error && (
          <div className="flex justify-center border rounded overflow-hidden">
            <img 
              src={imageUrl}
              alt={`Figma preview for ${fileName}`}
              className="max-w-full object-contain"
              style={{ maxHeight: '500px' }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}