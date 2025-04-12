 // lib/types.ts
/**
 * TypeScript type definitions for the Figma-to-Code application
 */

// Figma-related types
export interface FigmaNode {
    id: string;
    name: string;
    type: string;
    children?: string[];
    properties?: Record<string, any>;
    pattern?: string;
    patternConfidence?: number;
  }
  
  export interface FigmaDesignData {
    id: string;
    name: string;
    lastModified?: string;
    document?: any;
    nodes: FigmaNode[];
    styles: {
      colors: Record<string, any>;
      textStyles: Record<string, any>;
      effects: Record<string, any>;
    };
  }
  
  // EDS-related types
  export interface EDSComponent {
    id: string;
    name: string;
    type: string;
    description?: string;
    category?: string;
    properties?: Record<string, any[]>;
  }
  
  export interface EDSLibrary {
    name: string;
    version: string;
    components: EDSComponent[];
  }
  
  // Analysis-related types
  export interface ComponentPattern {
    count: number;
    confidence: number;
    nodeIds: string[];
  }
  
  export interface StyleIssue {
    type: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
    affectedItems: string[];
    suggestion?: string;
  }
  
  export interface AnalysisResult {
    patterns: Record<string, ComponentPattern>;
    styleIssues: StyleIssue[];
    metadata: Record<string, any>;
    enrichedNodes: FigmaNode[];
  }
  
  // Mapping-related types
  export interface ComponentMapping {
    figmaComponent: FigmaNode;
    edsComponent: EDSComponent;
    properties: Record<string, any>;
    confidence: number;
  }
  
  // Generation-related types
  export interface GenerationOptions {
    framework: 'react' | 'vue' | 'angular' | 'html';
    typescript: boolean;
    styling: 'css' | 'tailwind' | 'styled-components' | 'css-modules' | 'scss';
    generateLayout: boolean;
      // Add these new properties
    includeDocumentation?: boolean;  // Optional property
    generateStories?: boolean;       // Optional property
  }
  
  export interface GeneratedComponent {
    name: string;
    type: string;
    files: Record<string, string>;
    metadata: {
      figmaId: string;
      edsId: string;
      confidence: number;
    };
  }
  
  export interface GeneratedLayout {
    name: string;
    files: Record<string, string>;
    metadata: {
      componentCount: number;
      timestamp: number;
    };
  }
  
  export interface CodeGenerationResult {
    components: GeneratedComponent[];
    layout?: GeneratedLayout;
    options: GenerationOptions;
    metadata: {
      timestamp: number;
      componentCount: number;
      framework: string;
      typescript: boolean;
      styling: string;
    };
  }
  
  // Validation-related types
  export interface ValidationIssue {
    id: string;
    type: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
    file: string;
    line?: number;
    column?: number;
    code?: string;
    suggestion?: string;
  }
  
  export interface ValidationResult {
    syntaxScore: number;
    styleScore: number;
    responsiveScore: number;
    overallScore: number;
    issues: ValidationIssue[];
    passedValidation: boolean;
    metadata: {
      timestamp: number;
      framework: string;
      totalIssues: number;
      criticalIssues: number;
    };
  }
  
  // Workflow-related types
  export type WorkflowStep = 'import' | 'analysis' | 'eds-import' | 'mapping' | 'generation' | 'validation';
  
  export interface WorkflowState {
    currentStep: WorkflowStep;
    completedSteps: WorkflowStep[];
    figmaData?: FigmaDesignData;
    analyzedData?: AnalysisResult;
    edsData?: EDSLibrary;
    mappings?: Record<string, ComponentMapping>;
    generatedCode?: CodeGenerationResult;
    validationResult?: ValidationResult;
  }
