export type WorkflowStep = {
    id: string;
    name: string;
    description: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    agent: any;
    dependencies: string[];
    output?: any;
    error?: string;
    progress?: number;
  };
  
  export interface IAgent {
    execute: (inputs: any[]) => Promise<any>;
  }
  
  export class WorkflowEngine {
    private steps: Map<string, WorkflowStep> = new Map();
    private onUpdate: (steps: WorkflowStep[]) => void;
    
    constructor(onUpdate: (steps: WorkflowStep[]) => void) {
      this.onUpdate = onUpdate;
    }
    
    addStep(step: WorkflowStep) {
      this.steps.set(step.id, step);
      this.notifyUpdate();
      return this;
    }
    
    getStep(stepId: string): WorkflowStep | undefined {
      return this.steps.get(stepId);
    }
    
    getAllSteps(): WorkflowStep[] {
      return Array.from(this.steps.values());
    }
    
    updateStepProgress(stepId: string, progress: number) {
      const step = this.steps.get(stepId);
      if (step) {
        step.progress = progress;
        this.notifyUpdate();
      }
    }
    
    async runWorkflow() {
      // Find steps with no dependencies or completed dependencies
      const readySteps = Array.from(this.steps.values())
        .filter(step => 
          step.status === 'pending' && 
          step.dependencies.every(depId => 
            !this.steps.has(depId) || this.steps.get(depId)?.status === 'completed'
          )
        );
      
      if (readySteps.length === 0) {
        // Check if workflow is completed
        const allCompleted = Array.from(this.steps.values())
          .every(step => ['completed', 'failed'].includes(step.status));
        
        if (!allCompleted) {
          // If not all steps are completed/failed but no ready steps,
          // it means there's a dependency cycle or a dependency on a failed step
          const pendingSteps = Array.from(this.steps.values())
            .filter(step => step.status === 'pending');
          
          // Mark steps with failed dependencies as failed
          for (const step of pendingSteps) {
            const hasFailedDependency = step.dependencies.some(depId => 
              this.steps.get(depId)?.status === 'failed'
            );
            
            if (hasFailedDependency) {
              step.status = 'failed';
              step.error = 'Dependency failed';
              this.notifyUpdate();
            }
          }
        }
        
        return;
      }
      
      // Run each ready step in parallel
      await Promise.all(readySteps.map(async step => {
        try {
          step.status = 'running';
          step.progress = 0;
          this.notifyUpdate();
          
          // Get inputs from dependencies
          const inputs = step.dependencies.map(depId => 
            this.steps.get(depId)?.output
          ).filter(Boolean);
          
          // Run the agent
          step.output = await step.agent.execute(inputs);
          step.status = 'completed';
          step.progress = 100;
        } catch (error) {
          console.error(`Step "${step.name}" failed:`, error);
          step.status = 'failed';
          step.error = error instanceof Error ? error.message : 'Unknown error';
          step.progress = 0;
        }
        
        this.notifyUpdate();
      }));
      
      // Continue with next batch of steps
      await this.runWorkflow();
    }
    
    resetWorkflow() {
      for (const step of this.steps.values()) {
        step.status = 'pending';
        step.output = undefined;
        step.error = undefined;
        step.progress = 0;
      }
      this.notifyUpdate();
    }
    
    private notifyUpdate() {
      this.onUpdate(this.getAllSteps());
    }
  }