import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { AgentMemory } from './memory';
import { FeedbackLoop } from './feedback-loop';
import { AgentRegistry } from './agent-registry';
import { Logger } from '../../config/logger';

export interface AgentOptions {
  name: string;
  description?: string;
  capabilities?: string[];
  maxMemoryItems?: number;
  learningRate?: number;
  feedbackThreshold?: number;
  dependencies?: string[]; // Other agent names this agent depends on
}

export interface AgentState {
  id: string;
  name: string;
  status: 'idle' | 'processing' | 'learning' | 'error';
  lastExecutionTime?: number;
  lastLearningTime?: number;
  successRate: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export abstract class Agent extends EventEmitter {
  protected id: string;
  protected name: string;
  protected description: string;
  protected capabilities: string[];
  protected state: AgentState;
  protected memory: AgentMemory;
  protected feedbackLoop: FeedbackLoop;
  
  constructor(options: AgentOptions) {
    super();
    this.id = uuidv4();
    this.name = options.name;
    this.description = options.description || '';
    this.capabilities = options.capabilities || [];
    
    this.state = {
      id: this.id,
      name: this.name,
      status: 'idle',
      successRate: 1.0,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.memory = new AgentMemory({
      agentId: this.id,
      maxItems: options.maxMemoryItems || 100
    });
    
    this.feedbackLoop = new FeedbackLoop({
      agentId: this.id,
      learningRate: options.learningRate || 0.1,
      threshold: options.feedbackThreshold || 0.7
    });
    
    // Register the agent
    AgentRegistry.register(this);
    
    Logger.info(`Agent "${this.name}" (${this.id}) initialized`);
  }
  
  /**
   * Execute the agent's main functionality
   * This method must be implemented by each specific agent
   */
  public abstract async execute<T, U>(input: T): Promise<U>;
  
  /**
   * Learn from feedback to improve the agent's performance
   */
  public async learn(): Promise<void> {
    try {
      this.setState({ status: 'learning' });
      
      // Get feedback data from the feedback loop
      const feedbackData = await this.feedbackLoop.getFeedbackData();
      
      if (feedbackData.length === 0) {
        Logger.info(`No feedback data available for agent "${this.name}" to learn from`);
        return;
      }
      
      // Implement agent-specific learning logic in child classes
      await this.performLearning(feedbackData);
      
      // Update agent state after learning
      this.setState({
        lastLearningTime: Date.now(),
        version: this.state.version + 1
      });
      
      Logger.info(`Agent "${this.name}" completed learning cycle`);
      this.emit('learned', { agentId: this.id, version: this.state.version });
    } catch (error) {
      Logger.error(`Error during learning for agent "${this.name}":`, error);
      this.setState({ status: 'error' });
      throw error;
    } finally {
      this.setState({ status: 'idle' });
    }
  }
  
  /**
   * Agent-specific learning implementation
   * Must be implemented by each agent type
   */
  protected abstract async performLearning(feedbackData: any[]): Promise<void>;
  
  /**
   * Process feedback about the agent's performance
   */
  public async processFeedback(feedback: { success: boolean; data: any; }): Promise<void> {
    await this.feedbackLoop.addFeedback(feedback);
    
    // If feedback indicates failure and exceeds threshold, trigger learning
    const successRate = await this.feedbackLoop.getSuccessRate();
    this.setState({ successRate });
    
    if (successRate < this.feedbackLoop.threshold) {
      Logger.info(`Agent "${this.name}" success rate (${successRate}) below threshold (${this.feedbackLoop.threshold}), triggering learning`);
      await this.learn();
    }
  }
  
  /**
   * Get the current state of the agent
   */
  public getState(): AgentState {
    return { ...this.state };
  }
  
  /**
   * Update the agent's state
   */
  protected setState(newState: Partial<AgentState>): void {
    this.state = {
      ...this.state,
      ...newState,
      updatedAt: new Date()
    };
    
    this.emit('stateChanged', this.state);
  }
  
  /**
   * Add an item to the agent's memory
   */
  protected async remember(key: string, data: any): Promise<void> {
    await this.memory.add(key, data);
  }
  
  /**
   * Retrieve an item from the agent's memory
   */
  protected async recall(key: string): Promise<any> {
    return this.memory.get(key);
  }
  
  /**
   * Clean up resources when the agent is no longer needed
   */
  public async dispose(): Promise<void> {
    // Unregister the agent
    AgentRegistry.unregister(this.id);
    
    // Clean up memory
    await this.memory.clear();
    
    // Remove all listeners
    this.removeAllListeners();
    
    Logger.info(`Agent "${this.name}" (${this.id}) disposed`);
  }
}
