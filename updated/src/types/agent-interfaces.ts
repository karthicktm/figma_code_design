// src/types/agent-interfaces.ts

// Base interface for all agents
export interface IAgent {
    execute(...inputs: any[]): Promise<any>;
  }
  
  // Design Input Agent interfaces
  export interface DesignInputResult {
    figmaFile: any;
    components: any[];
    styles: any;
    assets: {
      images: any[];
      icons: any[];
      fonts: string[];
    };
  }
  
  // Asset Manager Agent interfaces
  export interface AssetManagerResult {
    downloadedAssets: {
      images: {
        id: string;
        url: string;
        localPath: string;
      }[];
      icons: {
        id: string;
        url: string;
        localPath: string;
        svg?: string;
      }[];
      fonts: {
        family: string;
        url?: string;
        localPath?: string;
        isGoogle?: boolean;
        isSystem?: boolean;
      }[];
    };
    missingAssets: {
      images: string[];
      icons: string[];
      fonts: string[];
    };
  }
  
  // Component Recognition Agent interfaces
  export interface RecognizedComponent {
    id: string;
    name: string;
    type: string;
    edsComponentType: string;
    properties: Record<string, any>;
    children?: RecognizedComponent[];
    layout?: {
      width: string | number;
      height: string | number;
      padding?: string;
      margin?: string;
      position?: string;
    };
    styles?: {
      colors?: string[];
      typography?: any;
    };
  }
  
  export interface ComponentRecognitionResult {
    components: RecognizedComponent[];
    pages: any[];
    layouts: any[];
  }
  
  // Style Extraction Agent interfaces
  export interface ExtractedStyles {
    colors: {
      name: string;
      value: string;
      edsVariable: string;
    }[];
    typography: {
      name: string;
      fontFamily: string;
      fontSize: string;
      fontWeight: string | number;
      lineHeight: string;
      edsVariable: string;
    }[];
    spacing: {
      name: string;
      value: string;
      edsVariable: string;
    }[];
    shadows: {
      name: string;
      value: string;
      edsVariable: string;
    }[];
    breakpoints: {
      name: string;
      value: string;
      edsVariable: string;
    }[];
  }
  
  // Code Generation Agent interfaces
  export interface GeneratedComponent {
    name: string;
    files: {
      componentTs: string;
      componentHtml: string;
      componentLess: string;
      moduleTs?: string;
    };
    dependencies: string[];
  }
  
  export interface CodeGenerationResult {
    components: GeneratedComponent[];
    styles: {
      variables: string;
      global: string;
    };
    project: {
      appModule: string;
      appComponent: string;
      routing: string;
    };
  }
  
  // Output & Preview Agent interfaces
  export interface OutputResult {
    projectStructure: {
      path: string;
      content: string;
    }[];
    preview: {
      url: string;
    };
    downloadUrl: string;
  }
