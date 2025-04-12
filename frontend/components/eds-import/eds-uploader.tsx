 // components/eds-import/eds-uploader.tsx
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UploadCloud, Loader2 } from 'lucide-react';
import { useEDS } from '@/contexts/eds-context';
import { useToast } from '@/components/ui/use-toast';

export default function EDSUploader() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { importEDSLibrary, isLoading } = useEDS();
  const { toast } = useToast();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select an EDS JSON file to upload.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        try {
          const json = JSON.parse(text);
          await importEDSLibrary(json);
          toast({
            title: "EDS library imported successfully",
            description: "Your EDS component library has been imported.",
          });
        } catch (error) {
          toast({
            title: "Invalid JSON file",
            description: "The selected file is not a valid JSON file.",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(selectedFile);
    } catch (error) {
      toast({
        title: "Import failed",
        description: "Failed to import the EDS library. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors">
        <label htmlFor="eds-file-upload" className="cursor-pointer block">
          <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
          <span className="mt-2 block text-sm font-medium">
            {selectedFile ? selectedFile.name : "Click to select or drag and drop your EDS JSON file"}
          </span>
          <Input
            id="eds-file-upload"
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      </div>
      
      <Button 
        onClick={handleUpload} 
        disabled={!selectedFile || isLoading} 
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Importing...
          </>
        ) : (
          "Upload and Import"
        )}
      </Button>
    </div>
  );
}
