export interface FigmaNode {
    id: string;
    name: string;
    type: string;
    children?: string[];
    parent?: string;
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
  

