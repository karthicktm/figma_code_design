import { Logger } from '../../config/logger';

interface FeedbackLoopOptions {
  agentId: string;
  learningRate: number;
  threshold: number;
  maxFeedbackItems?: number;
}

interface FeedbackItem {
  timestamp: number;
  success: boolean;
  data: any;
}

export class FeedbackLoop {
  public readonly agentId: string;
  public readonly learningRate: number;
  public readonly threshold: number;
  private maxItems: number;
  private feedbackHistory: FeedbackItem[];
  
  constructor(options: FeedbackLoopOptions) {
    this.agentId = options.agentId;
    this.learningRate = options.learningRate;
    this.threshold = options.threshold;
    this.maxItems = options.maxFeedbackItems || 100;
    this.feedbackHistory = [];
    
    Logger.info(`Feedback loop initialized for agent ${this.agentId} with learning rate ${this.learningRate} and threshold ${this.threshold}`);
  }
  
  /**
   * Add a feedback item to the history
   */
  public async addFeedback(feedback: { success: boolean; data: any; }): Promise<void> {
    // Add to the beginning to keep most recent feedback first
    this.feedbackHistory.unshift({
      timestamp: Date.now(),
      success: feedback.success,
      data: feedback.data
    });
    
    // Trim history if it exceeds the maximum size
    if (this.feedbackHistory.length > this.maxItems) {
      this.feedbackHistory = this.feedbackHistory.slice(0, this.maxItems);
    }
  }
  
  /**
   * Get all feedback data for learning
   */
  public async getFeedbackData(): Promise<any[]> {
    // Format feedback data for learning
    return this.feedbackHistory.map(item => ({
      success: item.success,
      data: item.data,
      timestamp: item.timestamp
    }));
  }
  
  /**
   * Calculate the current success rate based on feedback history
   */
  public async getSuccessRate(): Promise<number> {
    if (this.feedbackHistory.length === 0) {
      return 1.0; // Default to 100% if no feedback
    }
    
    // Calculate success rate with more weight to recent feedback
    let weightedSuccess = 0;
    let totalWeight = 0;
    
    this.feedbackHistory.forEach((item, index) => {
      // Apply exponential decay based on recency
      const weight = Math.exp(-index * 0.1);
      weightedSuccess += item.success ? weight : 0;
      totalWeight += weight;
    });
    
    return totalWeight > 0 ? weightedSuccess / totalWeight : 1.0;
  }
  
  /**
   * Clear all feedback history
   */
  public async clear(): Promise<void> {
    this.feedbackHistory = [];
  }
  
  /**
   * Get the number of feedback items
   */
  public size(): number {
    return this.feedbackHistory.length;
  }
}
