import { create } from 'zustand';
import { WorkflowStep } from '@/lib/workflow-engine';
import { DesignInputAgent } from '@/agents/design-input-agent';
import { AssetManagerAgent } from '@/agents/asset-manager-agent';
import { ComponentRecognitionAgent } from '@/agents/component-recognition-agent';
import { StyleExtractionAgent } from '@/agents/style-extraction-agent';
import { CodeGenerationAgent } from '@/agents/code-generation-agent';
import { OutputPreviewAgent } from '@/agents/output-preview-agent';

export enum AppStatus {
  Idle = 'idle',
  ProcessingInput = 'processingInput',
  ProcessingAssets = 'processingAssets',
  RecognizingComponents = 'recognizingComponents',
  ExtractingStyles = 'extractingStyles',
  GeneratingCode = 'generatingCode',
  PreparingOutput = 'preparingOutput',
  Complete = 'complete',
  Error = 'error'
}

export interface MissingAsset {
  type: 'images' | 'icons' | 'fonts';
  name: string;
}

interface AppState {
  // Inputs
  figmaApiKey: string;
  figmaFileId: string;
  azureEndpoint: string;
  azureApiKey: string;
  azureDeploymentName: string;
  projectName: string;
  
  // Processing state
  status: AppStatus;
  workflowSteps: WorkflowStep[];
  error: string | null;
  
  // Results
  figmaPreviewUrl: string | null;
  missingAssets: MissingAsset[];
  generatedCode: {
    components: any[];
    styles: {
      variables: string;
      global: string;
    };
    project: {
      appModule: string;
      appComponent: string;
      routing: string;
    };
  } | null;
  downloadUrl: string | null;
  
  // Actions
  setFigmaApiKey: (key: string) => void;
  setFigmaFileId: (id: string) => void;
  setAzureEndpoint: (endpoint: string) => void;
  setAzureApiKey: (key: string) => void;
  setAzureDeploymentName: (name: string) => void;
  setProjectName: (name: string) => void;
  startWorkflow: () => Promise<void>;
  uploadAsset: (assetType: 'images' | 'icons' | 'fonts', file: File) => Promise<void>;
  resetWorkflow: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Inputs
  figmaApiKey: '',
  figmaFileId: '',
  azureEndpoint: '',
  azureApiKey: '',
  azureDeploymentName: 'gpt-4',
  projectName: 'eds-angular-app',
  
  // Processing state
  status: AppStatus.Idle,
  workflowSteps: [],
  error: null,
  
  // Results
  figmaPreviewUrl: null,
  missingAssets: [],
  generatedCode: null,
  downloadUrl: null,
  
  // Actions
  setFigmaApiKey: (key: string) => set({ figmaApiKey: key }),
  setFigmaFileId: (id: string) => set({ figmaFileId: id }),
  setAzureEndpoint: (endpoint: string) => set({ azureEndpoint: endpoint }),
  setAzureApiKey: (key: string) => set({ azureApiKey: key }),
  setAzureDeploymentName: (name: string) => set({ azureDeploymentName: name }),
  setProjectName: (name: string) => set({ projectName: name }),
  
  startWorkflow: async () => {
    const { 
      figmaApiKey, 
      figmaFileId, 
      azureEndpoint, 
      azureApiKey, 
      azureDeploymentName,
      projectName
    } = get();
    
    // Validate inputs
    if (!figmaApiKey || !figmaFileId) {
      set({ 
        error: 'Figma API key and file ID are required',
        status: AppStatus.Error 
      });
      return;
    }
    
    if (!azureEndpoint || !azureApiKey) {
      set({ 
        error: 'Azure OpenAI credentials are required for code generation',
        status: AppStatus.Error 
      });
      return;
    }
    
    try {
      // Initialize agents
      const designInputAgent = new DesignInputAgent(
        { apiKey: figmaApiKey, fileId: figmaFileId },
        (progress) => updateStepProgress('designInput', progress)
      );
      
      const assetManagerAgent = new AssetManagerAgent(
        { apiKey: figmaApiKey, fileId: figmaFileId },
        (progress) => updateStepProgress('assetManager', progress)
      );
      
      const componentRecognitionAgent = new ComponentRecognitionAgent(
        (progress) => updateStepProgress('componentRecognition', progress)
      );
      
      const styleExtractionAgent = new StyleExtractionAgent(
        (progress) => updateStepProgress('styleExtraction', progress)
      );
      
      const codeGenerationAgent = new CodeGenerationAgent(
        { 
          azureEndpoint, 
          apiKey: azureApiKey, 
          deploymentName: azureDeploymentName 
        },
        (progress) => updateStepProgress('codeGeneration', progress)
      );
      
      const outputPreviewAgent = new OutputPreviewAgent(
        { projectName },
        (progress) => updateStepProgress('outputPreview', progress)
      );
      
      // Set initial workflow steps
      const workflowSteps: WorkflowStep[] = [
        {
          id: 'designInput',
          name: 'Design Input',
          description: 'Extract data from Figma design',
          status: 'pending',
          agent: designInputAgent,
          dependencies: [],
          progress: 0
        },
        {
          id: 'assetManager',
          name: 'Asset Manager',
          description: 'Process and download design assets',
          status: 'pending',
          agent: assetManagerAgent,
          dependencies: ['designInput'],
          progress: 0
        },
        {
          id: 'componentRecognition',
          name: 'Component Recognition',
          description: 'Identify UI components in design',
          status: 'pending',
          agent: componentRecognitionAgent,
          dependencies: ['designInput'],
          progress: 0
        },
        {
          id: 'styleExtraction',
          name: 'Style Extraction',
          description: 'Extract design tokens and styles',
          status: 'pending',
          agent: styleExtractionAgent,
          dependencies: ['designInput', 'componentRecognition'],
          progress: 0
        },
        {
          id: 'codeGeneration',
          name: 'Code Generation',
          description: 'Generate Angular components with EDS',
          status: 'pending',
          agent: codeGenerationAgent,
          dependencies: ['componentRecognition', 'styleExtraction'],
          progress: 0
        },
        {
          id: 'outputPreview',
          name: 'Output & Preview',
          description: 'Prepare final code output and preview',
          status: 'pending',
          agent: outputPreviewAgent,
          dependencies: ['codeGeneration'],
          progress: 0
        }
      ];
      
      set({ 
        workflowSteps,
        status: AppStatus.ProcessingInput,
        error: null
      });
      
      // Execute each step in sequence based on dependencies
      let designInputResult;
      let assetManagerResult;
      let componentRecognitionResult;
      let styleExtractionResult;
      let codeGenerationResult;
      let outputPreviewResult;
      
      // Design Input
      try {
        set({ status: AppStatus.ProcessingInput });
        updateStepStatus('designInput', 'running');
        designInputResult = await designInputAgent.execute([]);
        updateStepStatus('designInput', 'completed');
        
        // Set Figma preview URL if available
        if (designInputResult.figmaFile) {
          // In a real implementation, we would generate a preview URL
          set({ figmaPreviewUrl: '#' });
        }
      } catch (error) {
        updateStepStatus('designInput', 'failed');
        set({ 
          error: `Design input error: ${error.message}`,
          status: AppStatus.Error 
        });
        return;
      }
      
      // Asset Manager
      try {
        set({ status: AppStatus.ProcessingAssets });
        updateStepStatus('assetManager', 'running');
        assetManagerResult = await assetManagerAgent.execute([designInputResult]);
        updateStepStatus('assetManager', 'completed');
        
        // Check for missing assets
        if (assetManagerResult.missingAssets) {
          const missingAssets: MissingAsset[] = [];
          
          if (assetManagerResult.missingAssets.images.length > 0) {
            assetManagerResult.missingAssets.images.forEach(image => {
              missingAssets.push({ type: 'images', name: image });
            });
          }
          
          if (assetManagerResult.missingAssets.icons.length > 0) {
            assetManagerResult.missingAssets.icons.forEach(icon => {
              missingAssets.push({ type: 'icons', name: icon });
            });
          }
          
          if (assetManagerResult.missingAssets.fonts.length > 0) {
            assetManagerResult.missingAssets.fonts.forEach(font => {
              missingAssets.push({ type: 'fonts', name: font });
            });
          }
          
          set({ missingAssets });
        }
      } catch (error) {
        updateStepStatus('assetManager', 'failed');
        set({ 
          error: `Asset processing error: ${error.message}`,
          status: AppStatus.Error 
        });
        return;
      }
      
      // Component Recognition
      try {
        set({ status: AppStatus.RecognizingComponents });
        updateStepStatus('componentRecognition', 'running');
        componentRecognitionResult = await componentRecognitionAgent.execute([designInputResult]);
        updateStepStatus('componentRecognition', 'completed');
      } catch (error) {
        updateStepStatus('componentRecognition', 'failed');
        set({ 
          error: `Component recognition error: ${error.message}`,
          status: AppStatus.Error 
        });
        return;
      }
      
      // Style Extraction
      try {
        set({ status: AppStatus.ExtractingStyles });
        updateStepStatus('styleExtraction', 'running');
        styleExtractionResult = await styleExtractionAgent.execute([
          designInputResult, 
          componentRecognitionResult
        ]);
        updateStepStatus('styleExtraction', 'completed');
      } catch (error) {
        updateStepStatus('styleExtraction', 'failed');
        set({ 
          error: `Style extraction error: ${error.message}`,
          status: AppStatus.Error 
        });
        return;
      }
      
      // Code Generation
      try {
        set({ status: AppStatus.GeneratingCode });
        updateStepStatus('codeGeneration', 'running');
        codeGenerationResult = await codeGenerationAgent.execute([
          componentRecognitionResult,
          styleExtractionResult
        ]);
        updateStepStatus('codeGeneration', 'completed');
        
        // Store generated code
        set({ generatedCode: codeGenerationResult });
      } catch (error) {
        updateStepStatus('codeGeneration', 'failed');
        set({ 
          error: `Code generation error: ${error.message}`,
          status: AppStatus.Error 
        });
        return;
      }
      
      // Output Preview
      try {
        set({ status: AppStatus.PreparingOutput });
        updateStepStatus('outputPreview', 'running');
        outputPreviewResult = await outputPreviewAgent.execute([codeGenerationResult]);
        updateStepStatus('outputPreview', 'completed');
        
        // Store download URL
        set({ 
          downloadUrl: outputPreviewResult.downloadUrl,
          status: AppStatus.Complete
        });
      } catch (error) {
        updateStepStatus('outputPreview', 'failed');
        set({ 
          error: `Output preparation error: ${error.message}`,
          status: AppStatus.Error 
        });
        return;
      }
      
    } catch (error) {
      set({ 
        error: `Workflow error: ${error.message}`,
        status: AppStatus.Error 
      });
    }
  },
  
  uploadAsset: async (assetType: 'images' | 'icons' | 'fonts', file: File) => {
    try {
      // In a real implementation, we would actually process the uploaded asset
      // For now, just remove it from missing assets
      const { missingAssets } = get();
      const updatedMissingAssets = missingAssets.filter(
        asset => !(asset.type === assetType && asset.name === file.name)
      );
      
      set({ missingAssets: updatedMissingAssets });
      
      return Promise.resolve();
    } catch (error) {
      set({ 
        error: `Asset upload error: ${error.message}`,
        status: AppStatus.Error 
      });
      return Promise.reject(error);
    }
  },
  
  resetWorkflow: () => {
    set({
      status: AppStatus.Idle,
      workflowSteps: [],
      error: null,
      figmaPreviewUrl: null,
      missingAssets: [],
      generatedCode: null,
      downloadUrl: null
    });
  }
}));

// Helper functions for updating steps
function updateStepStatus(stepId: string, status: 'pending' | 'running' | 'completed' | 'failed') {
  const { workflowSteps } = useAppStore.getState();
  const updatedSteps = workflowSteps.map(step => 
    step.id === stepId ? { ...step, status } : step
  );
  
  useAppStore.setState({ workflowSteps: updatedSteps });
}

function updateStepProgress(stepId: string, progress: number) {
  const { workflowSteps } = useAppStore.getState();
  const updatedSteps = workflowSteps.map(step => 
    step.id === stepId ? { ...step, progress } : step
  );
  
  useAppStore.setState({ workflowSteps: updatedSteps });
}