// app/analysis/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { useFigma } from '@/contexts/figma-context';
import { useWorkflow } from '@/contexts/workflow-context';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { AnalysisPanel } from '@/components/design-analysis/analysis-panel';
import { PatternDetector } from '@/components/design-analysis/pattern-detector';
import { StyleValidator } from '@/components/design-analysis/style-validator';

export default function AnalysisPage() {
  const { figmaData, analyzedData, analyzeDesign, isAnalyzing } = useFigma();
  const { completeStep, canProceed } = useWorkflow();
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('patterns');

  // Redirect if no figma data is available
  useEffect(() => {
    if (!figmaData) {
      toast({
        title: "No design data",
        description: "Please import a Figma design first.",
        variant: "destructive",
      });
      router.push('/import');
    }
  }, [figmaData, router, toast]);

  const handleAnalyze = async () => {
    try {
      await analyzeDesign();
      toast({
        title: "Analysis completed",
        description: "Design analysis has been completed successfully.",
      });
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: "Failed to analyze the design. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleContinue = () => {
    if (analyzedData) {
      completeStep('analysis');
      router.push('/eds-import');
    } else {
      toast({
        title: "Analysis required",
        description: "Please analyze the design before continuing.",
        variant: "destructive",
      });
    }
  };

  if (!figmaData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Design Analysis</h1>
        <p className="text-muted-foreground">Analyze your Figma design to detect patterns and validate styles.</p>
      </div>

      <AnalysisPanel 
        figmaData={figmaData}
        isAnalyzing={isAnalyzing}
        onAnalyze={handleAnalyze}
      />

      {analyzedData && (
        <>
          <Tabs defaultValue="patterns" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="patterns">Component Patterns</TabsTrigger>
              <TabsTrigger value="styles">Style Issues</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
            </TabsList>
            
            <TabsContent value="patterns" className="space-y-4">
              <PatternDetector patterns={analyzedData.patterns} />
            </TabsContent>
            
            <TabsContent value="styles" className="space-y-4">
              <StyleValidator styleIssues={analyzedData.styleIssues} />
            </TabsContent>
            
            <TabsContent value="metadata" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(analyzedData.metadata).map(([key, value]) => (
                  <div key={key} className="p-4 bg-muted rounded-md">
                    <h4 className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                    <p className="text-2xl font-bold">{value}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end">
            <Button onClick={handleContinue}>
              Continue to EDS Import
            </Button>
          </div>
        </>
      )}
    </div>
  );
}