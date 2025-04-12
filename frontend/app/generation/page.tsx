// app/generation/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Code } from 'lucide-react';
import { useWorkflow } from '@/contexts/workflow-context';
import { useFigma } from '@/contexts/figma-context';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { FrameworkSelector } from '@/components/code-generation/framework-selector';
import { OptionsPanel } from '@/components/code-generation/options-panel';
import { CodePreview } from '@/components/code-generation/code-preview';
import { GenerationOptions } from '@/lib/types';
import { apiClient } from '@/lib/api-client';
import {  CodeGenerationResult } from '@/lib/types';


export default function GenerationPage() {
  const { mappings, setGeneratedCode, generatedCode } = useWorkflow();
  const { figmaComponents } = useFigma();
  const { completeStep } = useWorkflow();
  const router = useRouter();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [options, setOptions] = useState<GenerationOptions>({
    framework: 'react',
    typescript: true,
    styling: 'tailwind',
    generateLayout: true
  });
  
  // Redirect if no mappings are available
  useEffect(() => {
    if (!mappings || Object.keys(mappings).length === 0) {
      toast({
        title: "No component mappings",
        description: "Please create component mappings first.",
        variant: "destructive"
      });
      router.push('/mapping');
    }
  }, [mappings, router, toast]);
  
  const handleGenerate = async () => {
    if (!mappings || Object.keys(mappings).length === 0) {
      toast({
        title: "No mappings available",
        description: "Please create component mappings before generating code.",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Call the API to generate code
      const result = await apiClient.generateCode({
        mappings: Object.values(mappings),
        options
      });
      
      // Update workflow context with generated code
      setGeneratedCode(result as CodeGenerationResult);
      
      toast({
        title: "Code generated successfully",
        description: `Generated components for the ${options.framework} framework.`
      });
    } catch (error) {
      console.error('Error generating code:', error);
      toast({
        title: "Code generation failed",
        description: "Failed to generate code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleContinue = () => {
    if (generatedCode) {
      completeStep('generation');
      router.push('/validation');
    } else {
      toast({
        title: "No code generated",
        description: "Please generate code before continuing.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Code Generation</h1>
        <p className="text-muted-foreground">Generate code for your components in your chosen framework.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <FrameworkSelector 
            options={options} 
            onChange={setOptions} 
          />
          
          <OptionsPanel 
            options={options} 
            onChange={setOptions} 
          />
        </div>
        
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Component Summary</CardTitle>
              <CardDescription>
                {mappings ? Object.keys(mappings).length : 0} components ready for code generation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mappings && Object.keys(mappings).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(mappings).map(([figmaId, mapping]) => (
                    <div key={figmaId} className="flex items-center justify-between p-2 bg-muted rounded-md">
                      <div>
                        <span className="font-medium">{mapping.figmaComponent.name}</span>
                        <span className="mx-2 text-muted-foreground">→</span>
                        <span>{mapping.edsComponent.name}</span>
                      </div>
                      <div>
                        <code className="text-xs bg-muted-foreground/20 p-1 rounded">
                          {mapping.edsComponent.type}
                        </code>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No component mappings available. Please go back and create mappings.
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleGenerate}
                disabled={isGenerating || !mappings || Object.keys(mappings).length === 0}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Code...
                  </>
                ) : (
                  <>
                    <Code className="mr-2 h-4 w-4" />
                    Generate Code
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          {generatedCode && (
            <>
              <CodePreview generatedCode={generatedCode} />
              
              <div className="flex justify-end">
                <Button onClick={handleContinue}>
                  Continue to Validation
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}