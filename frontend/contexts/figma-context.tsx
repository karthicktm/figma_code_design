// contexts/figma-context.tsx
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { FigmaDesignData, AnalysisResult, FigmaNode, ComponentMapping } from '@/lib/types';
import { toast } from "sonner";
import { apiClient } from '@/lib/api-client';
import { FigmaParser } from '@/lib/figma-parser';
import { useWorkflow } from './workflow-context';

interface FigmaContextType {
  figmaData: FigmaDesignData | null;
  analyzedData: AnalysisResult | null;
  figmaComponents: FigmaNode[] | null;
  mappings: Record<string, ComponentMapping>;
  isLoading: boolean;
  isAnalyzing: boolean;
  importFigmaFile: (data: any) => Promise<void>;
  importFigmaViaAPI: (token: string, fileId: string) => Promise<void>;
  analyzeDesign: () => Promise<void>;
}

const FigmaContext = createContext<FigmaContextType | undefined>(undefined);

interface FigmaProviderProps {
  children: ReactNode;
}

export function FigmaProvider({ children }: FigmaProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [figmaComponents, setFigmaComponents] = useState<FigmaNode[] | null>(null);
  const { 
    figmaData, 
    setFigmaData, 
    analyzedData, 
    setAnalyzedData 
  } = useWorkflow();
  //const { toast } = useToast();
  
  /**
   * Import a Figma file from a JSON object
   */
  const importFigmaFile = async (data: any) => {
    setIsLoading(true);
    
    try {
      // In a real app, we would validate the data structure
      
      // Process the file locally
      const components = FigmaParser.extractComponents(data);
      setFigmaComponents(components);
      
      // Create a FigmaDesignData object
      const designData: FigmaDesignData = {
        id: data.document?.id || 'unknown',
        name: data.name || 'Untitled Figma File',
        lastModified: data.lastModified || new Date().toISOString(),
        document: data.document,
        nodes: components,
        styles: {
          colors: FigmaParser.extractColorStyles(data),
          textStyles: FigmaParser.extractTextStyles(data),
          effects: {}
        }
      };
      
      // Update the workflow context
      setFigmaData(designData);
      
      // Also send to backend for processing
      await apiClient.importFigmaFile(data);
      
      toast.success(`Imported "${designData.name}" with ${components.length} components.`)
    } catch (error) {
      console.error('Error importing Figma file:', error);
      toast.error("Failed to import the Figma file: ${error instanceof Error ? error.message : 'Unknown error'}")
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Import a Figma file via the Figma API
   */
  const importFigmaViaAPI = async (token: string, fileId: string) => {
    setIsLoading(true);
    
    try {
      // Call the backend to fetch the Figma file
      const response = await apiClient.post('/figma/fetch', { token, fileId });
      
      // Process the file
      await importFigmaFile(response);
    } catch (error) {
      console.error('Error importing Figma file via API:', error);
      toast.error(`Failed to import the Figma file via API: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Analyze the Figma design
   */
  const analyzeDesign = async () => {
    if (!figmaData) {
      toast.error("No design to analyze. Please import a Figma file first.")
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      // Call the backend to analyze the design
      const result = await apiClient.analyzeFigmaDesign(figmaData) as AnalysisResult;
      
      // Update the workflow context
      setAnalyzedData(result);
      
   
      toast.success(`Detected ${Object.keys(result.patterns).length} component patterns and ${result.styleIssues.length} style issues.`)
    } catch (error) {
      console.error('Error analyzing design:', error);
      toast.error("Failed to analyze the design: ${error instanceof Error ? error.message : 'Unknown error'}")
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  return (
    <FigmaContext.Provider value={{
      figmaData,
      analyzedData,
      figmaComponents,
      mappings: {},
      isLoading,
      isAnalyzing,
      importFigmaFile,
      importFigmaViaAPI,
      analyzeDesign
    }}>
      {children}
    </FigmaContext.Provider>
  );
}

export function useFigma() {
  const context = useContext(FigmaContext);
  if (context === undefined) {
    throw new Error('useFigma must be used within a FigmaProvider');
  }
  return context;
}