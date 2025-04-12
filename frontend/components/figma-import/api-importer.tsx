 // components/figma-import/api-importer.tsx
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useFigma } from '@/contexts/figma-context';
import { toast } from 'sonner';

export default function ApiImporter() {
  const [apiToken, setApiToken] = useState('');
  const [fileId, setFileId] = useState('');
  const { importFigmaViaAPI, isLoading } = useFigma();
  //const { toast } = useToast();
  
  const handleImport = async () => {
    if (!apiToken) {
      toast.error("Please enter your Figma API token.")
      
      return;
    }
    
    if (!fileId) {
      toast.error("Please enter the Figma file ID.")
      return;
    }
    
    try {
      // Validate fileId format (basic validation)
      if (!/^[a-zA-Z0-9_-]+$/.test(fileId)) {
        toast.error("Please enter a valid Figma file ID.")
        return;
      }
      
      await importFigmaViaAPI(apiToken, fileId);
      toast.success("Your Figma design has been imported via API.")
    } catch (error) {
      toast.error("Failed to import the Figma file via API. Please check your token and file ID.")
    }
  };
  
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="api-token" className="block text-sm font-medium text-gray-700 mb-1">
          Figma API Token
        </label>
        <Input
          id="api-token"
          type="password"
          value={apiToken}
          onChange={(e) => setApiToken(e.target.value)}
          placeholder="Enter your Figma API token"
        />
        <p className="mt-1 text-xs text-gray-500">
          You can generate a personal access token from your Figma account settings.
        </p>
      </div>
      
      <div>
        <label htmlFor="file-id" className="block text-sm font-medium text-gray-700 mb-1">
          Figma File ID
        </label>
        <Input
          id="file-id"
          value={fileId}
          onChange={(e) => setFileId(e.target.value)}
          placeholder="Enter Figma file ID (e.g., abc123def456)"
        />
        <p className="mt-1 text-xs text-gray-500">
          The file ID is found in the Figma file URL: figma.com/file/<strong>FILE_ID</strong>/title
        </p>
      </div>
      
      <Button 
        onClick={handleImport} 
        disabled={!apiToken || !fileId || isLoading} 
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Importing...
          </>
        ) : (
          "Fetch Design"
        )}
      </Button>
    </div>
  );
}
