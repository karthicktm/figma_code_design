// src/store/index.ts
import { create } from 'zustand';

// Common status enum used across all agents
export enum AgentStatus {
  Idle = 'idle',
  Running = 'running',
  Complete = 'complete',
  Error = 'error'
}

// Agent-specific data interfaces
export interface DesignInputState {
  status: AgentStatus;
  apiKey: string;
  fileId: string;
  result: any | null;
  error: string | null;
  progress: number;
}

export interface AssetManagerState {
  status: AgentStatus;
  result: any | null;
  error: string | null;
  progress: number;
  missingAssets: Array<{
    type: 'images' | 'icons' | 'fonts';
    name: string;
  }>;
}

export interface ComponentRecognitionState {
  status: AgentStatus;
  result: any | null;
  error: string | null;
  progress: number;
}

export interface StyleExtractionState {
  status: AgentStatus;
  result: any | null;
  error: string | null;
  progress: number;
}

export interface CodeGenerationState {
  status: AgentStatus;
  azureEndpoint: string;
  apiKey: string;
  deploymentName: string;
  result: any | null;
  error: string | null;
  progress: number;
}

export interface OutputPreviewState {
  status: AgentStatus;
  projectName: string;
  result: any | null;
  error: string | null;
  progress: number;
  downloadUrl: string | null;
}

// Main application state
interface AppState {
  // Project details
  projectName: string;
  
  // Individual agent states
  designInput: DesignInputState;
  assetManager: AssetManagerState;
  componentRecognition: ComponentRecognitionState;
  styleExtraction: StyleExtractionState;
  codeGeneration: CodeGenerationState;
  outputPreview: OutputPreviewState;
  
  // Currently active tab/module
  activeModule: string;
  
  // Common actions
  setActiveModule: (module: string) => void;
  setProjectName: (name: string) => void;
  resetAll: () => void;
  
  // Design Input actions
  setDesignInputApiKey: (key: string) => void;
  setDesignInputFileId: (id: string) => void;
  runDesignInputAgent: () => Promise<void>;
  setDesignInputProgress: (progress: number) => void;
  resetDesignInput: () => void;
  
  // Asset Manager actions
  runAssetManagerAgent: (designInputResult: any) => Promise<void>;
  setAssetManagerProgress: (progress: number) => void;
  uploadAsset: (assetType: 'images' | 'icons' | 'fonts', file: File) => Promise<void>;
  resetAssetManager: () => void;
  
  // Component Recognition actions
  runComponentRecognitionAgent: (params: { designInput: any; assetManager: any }) => Promise<void>;
  setComponentRecognitionProgress: (progress: number) => void;
  resetComponentRecognition: () => void;
  
  // Style Extraction actions
  runStyleExtractionAgent: (designInputResult: any, componentResult: any) => Promise<void>;
  setStyleExtractionProgress: (progress: number) => void;
  resetStyleExtraction: () => void;
  
  // Code Generation actions
  setCodeGenAzureEndpoint: (endpoint: string) => void;
  setCodeGenApiKey: (key: string) => void;
  setCodeGenDeploymentName: (name: string) => void;
  runCodeGenerationAgent: (componentResult: any, styleResult: any) => Promise<void>;
  setCodeGenerationProgress: (progress: number) => void;
  resetCodeGeneration: () => void;
  
  // Output Preview actions
  runOutputPreviewAgent: (codeResult: any) => Promise<void>;
  setOutputPreviewProgress: (progress: number) => void;
  resetOutputPreview: () => void;
}

// Initial state for each agent
const initialDesignInputState: DesignInputState = {
  status: AgentStatus.Idle,
  apiKey: '',
  fileId: '',
  result: null,
  error: null,
  progress: 0
};

const initialAssetManagerState: AssetManagerState = {
  status: AgentStatus.Idle,
  result: null,
  error: null,
  progress: 0,
  missingAssets: []
};

const initialComponentRecognitionState: ComponentRecognitionState = {
  status: AgentStatus.Idle,
  result: null,
  error: null,
  progress: 0
};

const initialStyleExtractionState: StyleExtractionState = {
  status: AgentStatus.Idle,
  result: null,
  error: null,
  progress: 0
};

const initialCodeGenerationState: CodeGenerationState = {
  status: AgentStatus.Idle,
  azureEndpoint: '',
  apiKey: '',
  deploymentName: 'gpt-4',
  result: null,
  error: null,
  progress: 0
};

const initialOutputPreviewState: OutputPreviewState = {
  status: AgentStatus.Idle,
  projectName: 'eds-angular-app',
  result: null,
  error: null,
  progress: 0,
  downloadUrl: null
};

// Create the store with empty implementations
// We'll add real implementations as we develop each module
export const useAppStore = create<AppState>((set, get) => ({
  // Common state
  projectName: 'eds-angular-app',
  activeModule: 'design-input',
  
  // Agent states
  designInput: initialDesignInputState,
  assetManager: initialAssetManagerState,
  componentRecognition: initialComponentRecognitionState,
  styleExtraction: initialStyleExtractionState,
  codeGeneration: initialCodeGenerationState,
  outputPreview: initialOutputPreviewState,
  
  // Common actions
  setActiveModule: (module: string) => set({ activeModule: module }),
  setProjectName: (name: string) => set({ projectName: name }),
  resetAll: () => set({
    designInput: initialDesignInputState,
    assetManager: initialAssetManagerState,
    componentRecognition: initialComponentRecognitionState,
    styleExtraction: initialStyleExtractionState,
    codeGeneration: initialCodeGenerationState,
    outputPreview: initialOutputPreviewState
  }),
  
  // Design Input actions
// Design Input actions
setDesignInputApiKey: (key: string) => set(state => ({
    designInput: {
      ...state.designInput,
      apiKey: key
    }
  })),
  setDesignInputFileId: (id: string) => set(state => ({
    designInput: {
      ...state.designInput,
      fileId: id
    }
  })),
  runDesignInputAgent: async () => {
    const { designInput } = get();
    const { apiKey, fileId } = designInput;
    
    // Validate inputs
    if (!apiKey || !fileId) {
      set(state => ({
        designInput: {
          ...state.designInput,
          status: AgentStatus.Error,
          error: 'Figma API key and file ID are required'
        }
      }));
      return;
    }
    
    try {
      // Set state to running
      set(state => ({
        designInput: {
          ...state.designInput,
          status: AgentStatus.Running,
          progress: 0,
          error: null,
          result: null
        }
      }));
      
      // Import dynamically to avoid server-side errors
      const { DesignInputAgent } = await import('@/modules/design-input/design-input-agent');
      
      // Create agent with progress tracking
      const agent = new DesignInputAgent(
        apiKey, 
        fileId, 
        (progress) => {
          set(state => ({
            designInput: {
              ...state.designInput,
              progress
            }
          }));
        }
      );
      
      // Execute agent
      const result = await agent.execute();
      
      // Update state with result
      set(state => ({
        designInput: {
          ...state.designInput,
          status: AgentStatus.Complete,
          progress: 100,
          result
        }
      }));
    } catch (error) {
      // Handle errors
      set(state => ({
        designInput: {
          ...state.designInput,
          status: AgentStatus.Error,
          error: error instanceof Error ? error.message : 'An unknown error occurred'
        }
      }));
    }
  },
  setDesignInputProgress: (progress: number) => set(state => ({
    designInput: {
      ...state.designInput,
      progress
    }
  })),
  resetDesignInput: () => set({
    designInput: initialDesignInputState
  }),
  
  // Asset Manager actions
// Asset Manager actions
runAssetManagerAgent: async (designInputResult: any) => {
    const { designInput } = get();
    const { apiKey, fileId } = designInput;
    
    // Validate inputs
    if (!apiKey || !fileId || !designInputResult) {
      set(state => ({
        assetManager: {
          ...state.assetManager,
          status: AgentStatus.Error,
          error: 'Required inputs are missing. Complete the Design Input step first.'
        }
      }));
      return;
    }
    
    try {
      // Set state to running
      set(state => ({
        assetManager: {
          ...state.assetManager,
          status: AgentStatus.Running,
          progress: 0,
          error: null,
          result: null
        }
      }));
      
      // Import dynamically to avoid server-side errors
      const { AssetManagerAgent } = await import('@/modules/asset-manager/asset-manager-agent');
      
      // Create agent with progress tracking
      const agent = new AssetManagerAgent(
        apiKey, 
        fileId, 
        (progress) => {
          set(state => ({
            assetManager: {
              ...state.assetManager,
              progress
            }
          }));
        }
      );
      
      // Execute agent
      const result = await agent.execute(designInputResult);
      
      // Update state with result
      set(state => ({
        assetManager: {
          ...state.assetManager,
          status: AgentStatus.Complete,
          progress: 100,
          result,
          missingAssets: [
            ...result.missingAssets.images.map(name => ({ type: 'images' as const, name })),
            ...result.missingAssets.icons.map(name => ({ type: 'icons' as const, name })),
            ...result.missingAssets.fonts.map(name => ({ type: 'fonts' as const, name })),
          ]
        }
      }));
    } catch (error) {
      // Handle errors
      set(state => ({
        assetManager: {
          ...state.assetManager,
          status: AgentStatus.Error,
          error: error instanceof Error ? error.message : 'An unknown error occurred'
        }
      }));
    }
  },
  setAssetManagerProgress: (progress: number) => set(state => ({
    assetManager: {
      ...state.assetManager,
      progress
    }
  })),
  uploadAsset: async (assetType: 'images' | 'icons' | 'fonts', file: File) => {
    try {
      // Import dynamically to avoid server-side errors
      const { AssetManagerAgent } = await import('@/modules/asset-manager/asset-manager-agent');
      
      // Get current asset manager state
      const { assetManager, designInput } = get();
      
      // Create agent instance
      const agent = new AssetManagerAgent(designInput.apiKey, designInput.fileId);
      
      // Add the file to the virtual file system
      await agent.addFile(file, assetType);
      
      // Update state by removing this asset from the missing assets list
      set(state => ({
        assetManager: {
          ...state.assetManager,
          missingAssets: state.assetManager.missingAssets.filter(
            asset => !(asset.type === assetType && asset.name === file.name)
          )
        }
      }));
      
      return Promise.resolve();
    } catch (error) {
      set(state => ({
        assetManager: {
          ...state.assetManager,
          error: error instanceof Error ? error.message : 'An unknown error occurred'
        }
      }));
      return Promise.reject(error);
    }
  },
  resetAssetManager: () => set({
    assetManager: initialAssetManagerState
  }),
  

// Component Recognition actions
  runComponentRecognitionAgent: async (params: { designInput: any; assetManager: any }) => {
  // Validate inputs
  if (!params.designInput) {
    set(state => ({
      componentRecognition: {
        ...state.componentRecognition,
        status: AgentStatus.Error,
        error: 'Design input data is required'
      }
    }));
    return;
  }
  
  try {
    // Set state to running
    set(state => ({
      componentRecognition: {
        ...state.componentRecognition,
        status: AgentStatus.Running,
        progress: 0,
        error: null,
        result: null
      }
    }));
    
    // Import dynamically to avoid server-side errors
    const { ComponentRecognitionAgent } = await import('@/modules/component-recognition/component-recognition-agent');
    
    // Create agent with progress tracking
    const agent = new ComponentRecognitionAgent(
      (progress) => {
        set(state => ({
          componentRecognition: {
            ...state.componentRecognition,
            progress
          }
        }));
      }
    );
    
    // Execute agent
    const result = await agent.execute(params.designInput, params.assetManager);
    
    // Update state with result
    set(state => ({
      componentRecognition: {
        ...state.componentRecognition,
        status: AgentStatus.Complete,
        progress: 100,
        result
      }
    }));
  } catch (error) {
    // Handle errors
    set(state => ({
      componentRecognition: {
        ...state.componentRecognition,
        status: AgentStatus.Error,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      }
    }));
  }
  },
  resetComponentRecognition: () => set({
    componentRecognition: initialComponentRecognitionState
  }),
  setComponentRecognitionProgress: (progress: number) => set(state => ({
    componentRecognition: {
      ...state.componentRecognition,
      progress
    }
  })),
  
  // Style Extraction actions
  runStyleExtractionAgent: async (designInputResult: any, componentResult: any) => {
    // Validate inputs
    if (!designInputResult || !componentResult) {
      set(state => ({
        styleExtraction: {
          ...state.styleExtraction,
          status: AgentStatus.Error,
          error: 'Design input and component recognition data are required'
        }
      }));
      return;
    }
    
    try {
      // Set state to running
      set(state => ({
        styleExtraction: {
          ...state.styleExtraction,
          status: AgentStatus.Running,
          progress: 0,
          error: null,
          result: null
        }
      }));
      
      // Import dynamically to avoid server-side errors
      const { StyleExtractionAgent } = await import('@/modules/style-extraction/style-extraction-agent');
      
      // Create agent with progress tracking
      const agent = new StyleExtractionAgent(
        (progress) => {
          set(state => ({
            styleExtraction: {
              ...state.styleExtraction,
              progress
            }
          }));
        }
      );
      
      // Execute agent
      const result = await agent.execute(designInputResult, componentResult);
      
      // Update state with result
      set(state => ({
        styleExtraction: {
          ...state.styleExtraction,
          status: AgentStatus.Complete,
          progress: 100,
          result
        }
      }));
    } catch (error) {
      // Handle errors
      set(state => ({
        styleExtraction: {
          ...state.styleExtraction,
          status: AgentStatus.Error,
          error: error instanceof Error ? error.message : 'An unknown error occurred'
        }
      }));
    }
  },
  resetStyleExtraction: () => set({
    styleExtraction: initialStyleExtractionState
  }),
  setStyleExtractionProgress: (progress: number) => set(state => ({
    styleExtraction: {
      ...state.styleExtraction,
      progress
    }
  })),
  
  // Code Generation actions
  setCodeGenAzureEndpoint: (endpoint: string) => set(state => ({
    codeGeneration: {
      ...state.codeGeneration,
      azureEndpoint: endpoint
    }
  })),
  setCodeGenApiKey: (key: string) => set(state => ({
    codeGeneration: {
      ...state.codeGeneration,
      apiKey: key
    }
  })),
  setCodeGenDeploymentName: (name: string) => set(state => ({
    codeGeneration: {
      ...state.codeGeneration,
      deploymentName: name
    }
  })),
  runCodeGenerationAgent: async (componentResult: any, styleResult: any) => {
    const { codeGeneration, designInput } = get();
    const { azureEndpoint, apiKey, deploymentName } = codeGeneration;
    const { fileId } = designInput;
    
    // Validate inputs
    if (!componentResult || !styleResult) {
      set(state => ({
        codeGeneration: {
          ...state.codeGeneration,
          status: AgentStatus.Error,
          error: 'Component recognition and style extraction results are required'
        }
      }));
      return;
    }
    
    if (!azureEndpoint || !apiKey) {
      set(state => ({
        codeGeneration: {
          ...state.codeGeneration,
          status: AgentStatus.Error,
          error: 'Azure OpenAI endpoint and API key are required'
        }
      }));
      return;
    }
    
    try {
      // Set state to running
      set(state => ({
        codeGeneration: {
          ...state.codeGeneration,
          status: AgentStatus.Running,
          progress: 0,
          error: null,
          result: null
        }
      }));
      
      // Import dynamically to avoid server-side errors
      const { CodeGenerationAgent } = await import('@/modules/code-generation/code-generation-agent');
      
      // Create agent with progress tracking
      const agent = new CodeGenerationAgent(
        apiKey,
        azureEndpoint,
        deploymentName,
        fileId,
        (progress) => {
          set(state => ({
            codeGeneration: {
              ...state.codeGeneration,
              progress
            }
          }));
        }
      );
      
      // Execute agent
      const result = await agent.execute(componentResult, styleResult);
      
      // Update state with result
      set(state => ({
        codeGeneration: {
          ...state.codeGeneration,
          status: AgentStatus.Complete,
          progress: 100,
          result
        }
      }));
    } catch (error) {
      // Handle errors
      set(state => ({
        codeGeneration: {
          ...state.codeGeneration,
          status: AgentStatus.Error,
          error: error instanceof Error ? error.message : 'An unknown error occurred'
        }
      }));
    }
  },
  setCodeGenerationProgress: (progress: number) => set(state => ({
    codeGeneration: {
      ...state.codeGeneration,
      progress
    }
  })),
  resetCodeGeneration: () => set({
    codeGeneration: initialCodeGenerationState
  }),
  
  // Output Preview actions
  runOutputPreviewAgent: async (codeResult: any) => {
    const { outputPreview, projectName } = get();
    
    // Validate inputs
    if (!codeResult) {
      set(state => ({
        outputPreview: {
          ...state.outputPreview,
          status: AgentStatus.Error,
          error: 'Code generation result is required'
        }
      }));
      return;
    }
    
    try {
      // Set state to running
      set(state => ({
        outputPreview: {
          ...state.outputPreview,
          status: AgentStatus.Running,
          progress: 0,
          error: null,
          result: null,
          downloadUrl: null
        }
      }));
      
      // Import dynamically to avoid server-side errors
      const { OutputPreviewAgent } = await import('@/modules/output-preview/output-preview-agent');
      
      // Create agent with progress tracking
      const agent = new OutputPreviewAgent(
        projectName,
        (progress) => {
          set(state => ({
            outputPreview: {
              ...state.outputPreview,
              progress
            }
          }));
        }
      );
      
      // Execute agent
      const result = await agent.execute(codeResult);
      
      // Update state with result
      set(state => ({
        outputPreview: {
          ...state.outputPreview,
          status: AgentStatus.Complete,
          progress: 100,
          result: {
            structure: result.projectStructure.map(f => f.path).join('\n')
          },
          downloadUrl: result.downloadUrl
        }
      }));
    } catch (error) {
      // Handle errors
      set(state => ({
        outputPreview: {
          ...state.outputPreview,
          status: AgentStatus.Error,
          error: error instanceof Error ? error.message : 'An unknown error occurred'
        }
      }));
    }
  },
  setOutputPreviewProgress: (progress: number) => set(state => ({
    outputPreview: {
      ...state.outputPreview,
      progress
    }
  })),
  resetOutputPreview: () => set({
    outputPreview: initialOutputPreviewState
  })
}));
