 // components/validation/download-button.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { CodeGenerationResult } from '@/lib/types';

interface DownloadButtonProps {
  generatedCode: CodeGenerationResult;
  isDownloading?: boolean;
  onDownload: (options: DownloadOptions) => void;
}

export interface DownloadOptions {
  format: 'zip' | 'tar';
  includeDocumentation: boolean;
  structureType: 'flat' | 'nested';
  projectName: string;
}

export function DownloadButton({ 
  generatedCode, 
  isDownloading = false, 
  onDownload 
}: DownloadButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [downloadOptions, setDownloadOptions] = useState<DownloadOptions>({
    format: 'zip',
    includeDocumentation: true,
    structureType: 'nested',
    projectName: 'figma-to-code-export'
  });
  const { toast } = useToast();
  
  // Update a specific option
  const updateOption = <K extends keyof DownloadOptions>(key: K, value: DownloadOptions[K]) => {
    setDownloadOptions({
      ...downloadOptions,
      [key]: value
    });
  };
  
  const handleDownload = () => {
    if (!generatedCode) {
      toast({
        title: "No code to download",
        description: "Please generate code first before downloading.",
        variant: "destructive",
      });
      return;
    }
    
    onDownload(downloadOptions);
    setIsDialogOpen(false);
  };
  
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Download Code
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Download Options</DialogTitle>
          <DialogDescription>
            Configure how you want to download your generated code.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input 
              id="project-name" 
              value={downloadOptions.projectName}
              onChange={(e) => updateOption('projectName', e.target.value)}
              placeholder="figma-to-code-export"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="format">Download Format</Label>
            <Select
              value={downloadOptions.format}
              onValueChange={(value) => updateOption('format', value as 'zip' | 'tar')}
            >
              <SelectTrigger id="format">
                <SelectValue placeholder="Select a format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zip">ZIP Archive (.zip)</SelectItem>
                <SelectItem value="tar">TAR Archive (.tar.gz)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="structure">Project Structure</Label>
            <Select
              value={downloadOptions.structureType}
              onValueChange={(value) => updateOption('structureType', value as 'flat' | 'nested')}
            >
              <SelectTrigger id="structure">
                <SelectValue placeholder="Select a structure" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nested">Nested (Components in folders)</SelectItem>
                <SelectItem value="flat">Flat (All files in root)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-docs"
              checked={downloadOptions.includeDocumentation}
              onCheckedChange={(checked) => 
                updateOption('includeDocumentation', !!checked)
              }
            />
            <Label htmlFor="include-docs" className="cursor-pointer">
              Include documentation
            </Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleDownload} disabled={isDownloading}>
            {isDownloading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Preparing...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
