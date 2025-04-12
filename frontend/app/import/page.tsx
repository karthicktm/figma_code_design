 'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import FileUploader from '@/components/figma-import/file-uploader';
import ApiImporter from '@/components/figma-import/api-importer';
import DesignPreview from '@/components/figma-import/design-preview';
import { useFigma } from '@/contexts/figma-context';
import { useWorkflow } from '@/contexts/workflow-context';
import { useRouter } from 'next/navigation';

export default function FigmaImport() {
  const [importMethod, setImportMethod] = useState<'file' | 'api'>('file');
  const { figmaData, isLoading } = useFigma();
  const { completeStep } = useWorkflow();
  const router = useRouter();
  
  const handleContinue = () => {
    if (figmaData) {
      completeStep('import');
      router.push('/analysis');
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Figma Import</h1>
        <p className="text-muted-foreground">Import your Figma design to get started.</p>
      </div>
      
      <Tabs defaultValue="file" onValueChange={(value) => setImportMethod(value as 'file' | 'api')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="file">Upload File</TabsTrigger>
          <TabsTrigger value="api">Figma API</TabsTrigger>
        </TabsList>
        <TabsContent value="file">
          <Card>
            <CardHeader>
              <CardTitle>Upload Figma JSON</CardTitle>
              <CardDescription>
                Export your Figma design as JSON and upload it here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploader />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>Import via Figma API</CardTitle>
              <CardDescription>
                Enter your Figma API token and file ID to fetch the design.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ApiImporter />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {figmaData && (
        <Card>
          <CardHeader>
            <CardTitle>Design Preview</CardTitle>
            <CardDescription>
              Review the imported design structure before continuing.
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-96 overflow-auto">
            <DesignPreview />
          </CardContent>
          <CardFooter>
            <Button onClick={handleContinue} className="ml-auto">
              Continue to Analysis
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
