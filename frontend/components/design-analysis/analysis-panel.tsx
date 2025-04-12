 'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { FigmaDesignData } from '@/lib/types';

interface AnalysisPanelProps {
  figmaData: FigmaDesignData;
  isAnalyzing: boolean;
  onAnalyze: () => void;
}

export function AnalysisPanel({ figmaData, isAnalyzing, onAnalyze }: AnalysisPanelProps) {
  // Get basic file information
  const fileInfo = {
    name: figmaData.name || 'Untitled Design',
    lastModified: figmaData.lastModified 
      ? new Date(figmaData.lastModified).toLocaleString() 
      : 'Unknown',
    pages: figmaData.document?.children?.length || 0,
    components: figmaData.nodes?.length || 0,
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Design Information</CardTitle>
        <CardDescription>Overview of your imported Figma design.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium">Design Name</h3>
            <p className="text-sm text-muted-foreground">{fileInfo.name}</p>
          </div>
          <div>
            <h3 className="font-medium">Last Modified</h3>
            <p className="text-sm text-muted-foreground">{fileInfo.lastModified}</p>
          </div>
          <div>
            <h3 className="font-medium">Pages</h3>
            <p className="text-sm text-muted-foreground">{fileInfo.pages} pages</p>
          </div>
          <div>
            <h3 className="font-medium">Components</h3>
            <p className="text-sm text-muted-foreground">{fileInfo.components} components</p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={onAnalyze} 
          disabled={isAnalyzing}
          className="w-full"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Analyze Design"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}