 'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, UploadCloud, Search } from 'lucide-react';
import { useEDS } from '@/contexts/eds-context';
import { useFigma } from '@/contexts/figma-context';
import { useWorkflow } from '@/contexts/workflow-context';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import EDSComponentBrowser from '@/components/eds-import/component-browser';

export default function EDSImport() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { importEDSLibrary, edsData, isLoading } = useEDS();
  const { analyzedData } = useFigma();
  const { completeStep } = useWorkflow();
  const router = useRouter();
  const { toast } = useToast();
  
  useEffect(() => {
    if (!analyzedData) {
      router.push('/analysis');
    }
  }, [analyzedData, router]);
  
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
            title: "Library imported successfully",
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
  
  const handleContinue = () => {
    if (edsData) {
      completeStep('eds-import');
      router.push('/mapping');
    }
  };
  
  if (!analyzedData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">EDS Library Import</h1>
        <p className="text-muted-foreground">Import your Enterprise Design System component library.</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Upload EDS Library</CardTitle>
          <CardDescription>
            Upload your Enterprise Design System (EDS) component library as a JSON file.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
      
      {edsData && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Component Library</CardTitle>
              <CardDescription>
                Available components in your Enterprise Design System.
              </CardDescription>
              <div className="relative mt-2">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search components..." className="pl-8" />
              </div>
            </CardHeader>
            <CardContent className="max-h-96 overflow-auto">
              <EDSComponentBrowser />
            </CardContent>
            <CardFooter>
              <Button onClick={handleContinue} className="ml-auto">
                Continue to Component Mapping
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
}
