// contexts/workflow-context.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  WorkflowStep, 
  FigmaDesignData, 
  AnalysisResult, 
  EDSLibrary, 
  ComponentMapping, 
  CodeGenerationResult, 
  ValidationResult 
} from '@/lib/types';
import { toast } from "sonner";

interface WorkflowContextType {
  currentStep: WorkflowStep;
  completedSteps: WorkflowStep[];
  figmaData: FigmaDesignData | null;
  analyzedData: AnalysisResult | null;
  edsData: EDSLibrary | null;
  mappings: Record<string, ComponentMapping>;
  generatedCode: CodeGenerationResult | null;
  validationResult: ValidationResult | null;
  setCurrentStep: (step: WorkflowStep) => void;
  completeStep: (step: WorkflowStep) => void;
  resetWorkflow: () => void;
  canProceed: (to: WorkflowStep) => boolean;
  setFigmaData: (data: FigmaDesignData) => void;
  setAnalyzedData: (data: AnalysisResult) => void;
  setEDSData: (data: EDSLibrary) => void;
  setMappings: (mappings: Record<string, ComponentMapping>) => void;
  setGeneratedCode: (code: CodeGenerationResult) => void;
  setValidationResult: (result: ValidationResult) => void;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

interface WorkflowProviderProps {
  children: ReactNode;
}

export function WorkflowProvider({ children }: WorkflowProviderProps) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('import');
  const [completedSteps, setCompletedSteps] = useState<WorkflowStep[]>([]);
  const [figmaData, setFigmaData] = useState<FigmaDesignData | null>(null);
  const [analyzedData, setAnalyzedData] = useState<AnalysisResult | null>(null);
  const [edsData, setEDSData] = useState<EDSLibrary | null>(null);
  const [mappings, setMappings] = useState<Record<string, ComponentMapping>>({});
  const [generatedCode, setGeneratedCode] = useState<CodeGenerationResult | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  //const { toast } = useToast();
  
  // Load state from localStorage on component mount
  useEffect(() => {
    const savedCurrentStep = localStorage.getItem('currentStep');
    const savedCompletedSteps = localStorage.getItem('completedSteps');
    
    if (savedCurrentStep) {
      setCurrentStep(savedCurrentStep as WorkflowStep);
    }
    
    if (savedCompletedSteps) {
      setCompletedSteps(JSON.parse(savedCompletedSteps));
    }
    
    // Try to load other data from localStorage
    try {
      const savedFigmaData = localStorage.getItem('figmaData');
      if (savedFigmaData) setFigmaData(JSON.parse(savedFigmaData));
      
      const savedAnalyzedData = localStorage.getItem('analyzedData');
      if (savedAnalyzedData) setAnalyzedData(JSON.parse(savedAnalyzedData));
      
      const savedEDSData = localStorage.getItem('edsData');
      if (savedEDSData) setEDSData(JSON.parse(savedEDSData));
      
      const savedMappings = localStorage.getItem('mappings');
      if (savedMappings) setMappings(JSON.parse(savedMappings));
      
      // Generated code and validation results are not stored in localStorage
      // due to their potentially large size
    } catch (error) {
      console.error('Error loading data from localStorage:', error);

      toast.error("Error loading saved data: ${error instanceof Error ? error.message : 'Unknown error'}")
    }
  }, [toast]);
  
  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('currentStep', currentStep);
    localStorage.setItem('completedSteps', JSON.stringify(completedSteps));
    
    // Save other data to localStorage
    if (figmaData) localStorage.setItem('figmaData', JSON.stringify(figmaData));
    if (analyzedData) localStorage.setItem('analyzedData', JSON.stringify(analyzedData));
    if (edsData) localStorage.setItem('edsData', JSON.stringify(edsData));
    if (Object.keys(mappings).length > 0) localStorage.setItem('mappings', JSON.stringify(mappings));
    
    // Generated code and validation results are not stored in localStorage
    // due to their potentially large size
  }, [currentStep, completedSteps, figmaData, analyzedData, edsData, mappings]);
  
  const completeStep = (step: WorkflowStep) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps([...completedSteps, step]);
    }
    
    // Determine next step
    const steps: WorkflowStep[] = ['import', 'analysis', 'eds-import', 'mapping', 'generation', 'validation'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };
  
  const resetWorkflow = () => {
    // Reset workflow state
    setCurrentStep('import');
    setCompletedSteps([]);
    
    // Reset data
    setFigmaData(null);
    setAnalyzedData(null);
    setEDSData(null);
    setMappings({});
    setGeneratedCode(null);
    setValidationResult(null);
    
    // Clear localStorage
    localStorage.removeItem('currentStep');
    localStorage.removeItem('completedSteps');
    localStorage.removeItem('figmaData');
    localStorage.removeItem('analyzedData');
    localStorage.removeItem('edsData');
    localStorage.removeItem('mappings');
    

    toast.success("All progress has been reset. Starting a new project.")
  };
  
  const canProceed = (to: WorkflowStep) => {
    const steps: WorkflowStep[] = ['import', 'analysis', 'eds-import', 'mapping', 'generation', 'validation'];
    const toIndex = steps.indexOf(to);
    const currentIndex = steps.indexOf(currentStep);
    
    // Can always go back
    if (toIndex < currentIndex) return true;
    
    // Can proceed to next step if current step is completed
    if (toIndex === currentIndex + 1) {
      return completedSteps.includes(currentStep);
    }
    
    // Cannot skip steps
    return false;
  };
  
  return (
    <WorkflowContext.Provider value={{
      currentStep,
      completedSteps,
      figmaData,
      analyzedData,
      edsData,
      mappings,
      generatedCode,
      validationResult,
      setCurrentStep,
      completeStep,
      resetWorkflow,
      canProceed,
      setFigmaData,
      setAnalyzedData,
      setEDSData,
      setMappings,
      setGeneratedCode,
      setValidationResult
    }}>
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflow() {
  const context = useContext(WorkflowContext);
  if (context === undefined) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
}