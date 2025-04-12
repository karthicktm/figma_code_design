 'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UploadCloud, Loader2 } from 'lucide-react';
import { useFigma } from '@/contexts/figma-context';
import { toast } from "sonner";

export default function FileUploader() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { importFigmaFile, isLoading } = useFigma();
  //const { toast } = useToast();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("No file selected. Please select a Figma JSON file to upload.")
      return;
    }
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        try {
          const json = JSON.parse(text);
          await importFigmaFile(json);

          toast.success("Your Figma design has been imported and is ready for analysis.")
        } catch (error) {
    
          toast.error("The selected file is not a valid JSON file.")
        }
      };
      reader.readAsText(selectedFile);
    } catch (error) {
      toast.error("Failed to import the Figma file. Please try again.")
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors">
        <label htmlFor="file-upload" className="cursor-pointer block">
          <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
          <span className="mt-2 block text-sm font-medium">
            {selectedFile ? selectedFile.name : "Click to select or drag and drop your Figma JSON file"}
          </span>
          <Input
            id="file-upload"
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
