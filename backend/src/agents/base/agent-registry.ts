import { Agent, AgentState } from './agent';
import { Logger } from '../../config/logger';

export class AgentRegistry {
  private static agents: Map<string, Agent> = new Map();
  
  /**
   * Register an agent with the registry
   */
  public static register(agent: Agent): void {
    if (this.agents.has(agent.getState().id)) {
      Logger.warn(`Agent with ID ${agent.getState().id} already registered`);
      return;
    }
    
    this.agents.set(agent.getState().id, agent);
    Logger.info(`Agent "${agent.getState().name}" (${agent.getState().id}) registered`);
  }
  
  /**
   * Unregister an agent from the registry
   */
  public static unregister(agentId: string): boolean {
    if (!this.agents.has(agentId)) {
      Logger.warn(`Agent with ID ${agentId} not found in registry`);
      return false;
    }
    
    const agent = this.agents.get(agentId)!;
    this.agents.delete(agentId);
    Logger.info(`Agent "${agent.getState().name}" (${agentId}) unregistered`);
    return true;
  }
  
  /**
   * Get an agent by ID
   */
  public static getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }
  
  /**
   * Get all registered agents
   */
  public static getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }
  
  /**
   * Get agent states for all registered agents
   */
  public static getAllAgentStates(): AgentState[] {
    return Array.from(this.agents.values()).map(agent => agent.getState());
  }
  
  /**
   * Find agents by name
   */
  public static findAgentsByName(name: string): Agent[] {
    return Array.from(this.agents.values()).filter(agent => 
      agent.getState().name.toLowerCase().includes(name.toLowerCase())
    );
  }
  
  /**
   * Clear the registry (mainly for testing)
   */
  public static clear(): void {
    this.agents.clear();
    Logger.info('Agent registry cleared');
  }
}

// Now, let's implement the Figma Parser Agent as an example of a specialized agent

