import { FigmaNode } from '../../types/figma.types';
import { Logger } from '../../config/logger';
import { LLM } from '../../lib/ai/llm';
import * as tf from '@tensorflow/tfjs-node';

interface PatternRule {
  name: string;
  condition: (node: FigmaNode) => boolean;
  confidence: number;
}

export class PatternDetector {
  private patterns: Map<string, PatternRule[]>;
  private useAI: boolean;
  private model: any; // TensorFlow model
  
  constructor() {
    this.patterns = new Map();
    this.useAI = true; // Use AI for pattern detection by default
    
    // Initialize with built-in patterns
    this.initializePatterns();
    
    // Initialize TensorFlow model
    this.initializeModel();
    
    Logger.info('PatternDetector initialized');
  }
  
  /**
   * Initialize built-in pattern detection rules
   */
  private initializePatterns(): void {
    // Button patterns
    this.patterns.set('button', [
      {
        name: 'button-rectangle-with-text',
        condition: (node: FigmaNode) => 
          (node.type === 'FRAME' || node.type === 'RECTANGLE') && 
          node.children?.length > 0 &&
          this.hasTextChild(node) &&
          (node.properties?.cornerRadius ?? 0) > 0,
        confidence: 0.9
      },
      {
        name: 'button-group-with-text',
        condition: (node: FigmaNode) => 
          node.type === 'GROUP' && 
          node.children?.length > 0 &&
          this.hasTextChild(node) &&
          node.name.toLowerCase().includes('button'),
        confidence: 0.8
      },
      {
        name: 'button-named-component',
        condition: (node: FigmaNode) => 
          (node.type === 'COMPONENT' || node.type === 'INSTANCE') && 
          node.name.toLowerCase().includes('button'),
        confidence: 0.95
      }
    ]);
    
    // Input field patterns
    this.patterns.set('input', [
      {
        name: 'input-rectangle-with-text',
        condition: (node: FigmaNode) => 
          (node.type === 'FRAME' || node.type === 'RECTANGLE') && 
          node.children?.length > 0 &&
          this.hasTextChild(node) &&
          (node.properties?.cornerRadius ?? 0) >= 0 &&
          node.name.toLowerCase().match(/input|field|text\s*field|text\s*box/),
        confidence: 0.9
      },
      {
        name: 'input-named-component',
        condition: (node: FigmaNode) => 
          (node.type === 'COMPONENT' || node.type === 'INSTANCE') && 
          node.name.toLowerCase().match(/input|field|text\s*field|text\s*box/),
        confidence: 0.95
      }
    ]);
    
    // Card patterns
    this.patterns.set('card', [
      {
        name: 'card-frame-with-content',
        condition: (node: FigmaNode) => 
          node.type === 'FRAME' && 
          node.children?.length >= 2 &&
          (node.properties?.cornerRadius ?? 0) > 0 &&
          (node.properties?.fills?.some((fill: any) => fill.type === 'SOLID' && fill.visible !== false) ?? false) &&
          node.name.toLowerCase().includes('card'),
        confidence: 0.9
      },
      {
        name: 'card-named-component',
        condition: (node: FigmaNode) => 
          (node.type === 'COMPONENT' || node.type === 'INSTANCE') && 
          node.name.toLowerCase().includes('card'),
        confidence: 0.95
      }
    ]);
    
    // List patterns
    this.patterns.set('list', [
      {
        name: 'list-frame-with-items',
        condition: (node: FigmaNode) => 
          node.type === 'FRAME' && 
          node.children?.length >= 3 &&
          node.name.toLowerCase().match(/list|menu|nav/),
        confidence: 0.8
      }
    ]);
  }
  
  /**
   * Initialize TensorFlow model for pattern detection
   */
  private async initializeModel(): Promise<void> {
    try {
      // Create a simple model for component classification
      const model = tf.sequential();
      
      // Input features: node type one-hot encoded (5), has text (1), has rectangle (1), etc.
      model.add(tf.layers.dense({
        inputShape: [20], 
        units: 32, 
        activation: 'relu'
      }));
      
      model.add(tf.layers.dense({
        units: 16, 
        activation: 'relu'
      }));
      
      // Output layer for multi-class classification of component types
      model.add(tf.layers.dense({
        units: 5, // button, input, card, list, other
        activation: 'softmax'
      }));
      
      model.compile({
        optimizer: 'adam',
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });
      
      this.model = model;
      Logger.info('TensorFlow model initialized for pattern detection');
    } catch (error) {
      Logger.error('Failed to initialize TensorFlow model:', error);
      this.useAI = false;
    }
  }
  
  /**
   * Detect patterns in the provided nodes
   */
  public async detectPatterns(nodes: FigmaNode[]): Promise<Record<string, any>> {
    Logger.info(`Detecting patterns in ${nodes.length} nodes`);
    
    const result: Record<string, any> = {};
    
    // Detect patterns using rule-based approach
    const ruleBasedPatterns = await this.detectPatternsWithRules(nodes);
    
    // Detect patterns using AI if enabled
    const aiPatterns = this.useAI 
      ? await this.detectPatternsWithAI(nodes)
      : {};
    
    // Merge results, prioritizing rule-based patterns when there's overlap
    for (const [patternName, pattern] of Object.entries(ruleBasedPatterns)) {
      result[patternName] = pattern;
    }
    
    for (const [patternName, pattern] of Object.entries(aiPatterns)) {
      if (!result[patternName]) {
        result[patternName] = pattern;
      } else {
        // If AI found additional nodes for this pattern, add them
        for (const nodeId of pattern.nodeIds) {
          if (!result[patternName].nodeIds.includes(nodeId)) {
            result[patternName].nodeIds.push(nodeId);
          }
        }
        
        // Update node count
        result[patternName].count = result[patternName].nodeIds.length;
      }
    }
    
    Logger.info(`Detected ${Object.keys(result).length} pattern types`);
    return result;
  }
  
  /**
   * Detect patterns using rule-based approach
   */
  private async detectPatternsWithRules(nodes: FigmaNode[]): Promise<Record<string, any>> {
    const result: Record<string, any> = {};
    
    for (const [patternType, rules] of this.patterns.entries()) {
      const matches = [];
      
      for (const node of nodes) {
        let highestConfidence = 0;
        let matchingRule = null;
        
        for (const rule of rules) {
          try {
            if (rule.condition(node) && rule.confidence > highestConfidence) {
              highestConfidence = rule.confidence;
              matchingRule = rule;
            }
          } catch (error) {
            // Skip this rule if it throws an error
            Logger.warn(`Error applying rule ${rule.name} to node ${node.id}:`, error);
          }
        }
        
        if (matchingRule && highestConfidence > 0.5) {
          matches.push({
            nodeId: node.id,
            confidence: highestConfidence,
            rule: matchingRule.name
          });
        }
      }
      
      if (matches.length > 0) {
        result[patternType] = {
          count: matches.length,
          confidence: matches.reduce((sum, match) => sum + match.confidence, 0) / matches.length,
          nodeIds: matches.map(match => match.nodeId)
        };
      }
    }
    
    return result;
  }
  
  /**
   * Detect patterns using AI approaches
   */
  private async detectPatternsWithAI(nodes: FigmaNode[]): Promise<Record<string, any>> {
    const result: Record<string, any> = {};
    
    try {
      // If we have enough nodes, use the TensorFlow model
      if (this.model && nodes.length >= 10) {
        Logger.info('Using TensorFlow model for pattern detection');
        
        // Encode nodes as features
        const features = nodes.map(node => this.encodeNodeFeatures(node));
        
        // Make predictions
        const inputTensor = tf.tensor2d(features);
        const predictions = this.model.predict(inputTensor) as tf.Tensor;
        const predictionValues = await predictions.array() as number[][];
        
        // Process predictions
        const patternTypes = ['button', 'input', 'card', 'list', 'other'];
        const patternNodes: Record<string, { nodeIds: string[], confidences: number[] }> = {};
        
        // Initialize pattern objects
        for (const type of patternTypes.filter(t => t !== 'other')) {
          patternNodes[type] = { nodeIds: [], confidences: [] };
        }
        
        // Assign nodes to patterns based on prediction
        nodes.forEach((node, i) => {
          const prediction = predictionValues[i];
          const maxIndex = prediction.indexOf(Math.max(...prediction));
          const patternType = patternTypes[maxIndex];
          const confidence = prediction[maxIndex];
          
          if (patternType !== 'other' && confidence > 0.6) {
            patternNodes[patternType].nodeIds.push(node.id);
            patternNodes[patternType].confidences.push(confidence);
          }
        });
        
        // Format results
        for (const [patternType, data] of Object.entries(patternNodes)) {
          if (data.nodeIds.length > 0) {
            result[patternType] = {
              count: data.nodeIds.length,
              confidence: data.confidences.reduce((sum, conf) => sum + conf, 0) / data.confidences.length,
              nodeIds: data.nodeIds
            };
          }
        }
        
        // Clean up tensors
        inputTensor.dispose();
        predictions.dispose();
      } else {
        Logger.info('Using LLM for pattern detection');
        
        // Use LLM for smaller datasets or when TensorFlow is not available
        // Get LLM to analyze patterns
        const llm = new LLM();
        
        // Prepare data for LLM
        const sampleNodes = nodes.slice(0, 50).map(node => ({
          id: node.id,
          name: node.name,
          type: node.type,
          childrenCount: node.children?.length || 0,
          properties: node.properties
        }));
        
        const prompt = `
          Analyze these Figma nodes and identify UI patterns:
          ${JSON.stringify(sampleNodes, null, 2)}
          
          Classify each node into one of these categories:
          - button
          - input
          - card
          - list
          - other
          
          For each category, return:
          1. The IDs of nodes that match that category
          2. A confidence score (0-1) for each match
        `;
        
        const response = await llm.generate(prompt);
        
        // Parse LLM response
        // This is a simplified parser - in a real system, we'd need more robust parsing
        try {
          // Assume the response has a JSON-like structure we can extract
          const classifications = this.parseLLMResponse(response);
          
          for (const [patternType, nodes] of Object.entries(classifications)) {
            if (patternType !== 'other' && nodes.length > 0) {
              result[patternType] = {
                count: nodes.length,
                confidence: nodes.reduce((sum, node) => sum + node.confidence, 0) / nodes.length,
                nodeIds: nodes.map(node => node.id)
              };
            }
          }
        } catch (error) {
          Logger.error('Error parsing LLM response:', error);
        }
      }
    } catch (error) {
      Logger.error('Error in AI pattern detection:', error);
    }
    
    return result;
  }
  
  /**
   * Encode node features for the machine learning model
   */
  private encodeNodeFeatures(node: FigmaNode): number[] {
    const features: number[] = Array(20).fill(0);
    
    // Node type one-hot encoding (first 5 features)
    const typeIndex = {
      'FRAME': 0,
      'GROUP': 1,
      'COMPONENT': 2,
      'INSTANCE': 3,
      'TEXT': 4
    }[node.type] || 0;
    
    if (typeIndex < 5) {
      features[typeIndex] = 1;
    }
    
    // Has text child
    features[5] = this.hasTextChild(node) ? 1 : 0;
    
    // Has corner radius
    features[6] = ((node.properties?.cornerRadius ?? 0) > 0) ? 1 : 0;
    
    // Has solid fill
    features[7] = node.properties?.fills?.some((fill: any) => 
      fill.type === 'SOLID' && fill.visible !== false
    ) ? 1 : 0;
    
    // Name contains 'button'
    features[8] = node.name.toLowerCase().includes('button') ? 1 : 0;
    
    // Name contains 'input' or 'field'
    features[9] = node.name.toLowerCase().match(/input|field/) ? 1 : 0;
    
    // Name contains 'card'
    features[10] = node.name.toLowerCase().includes('card') ? 1 : 0;
    
    // Name contains 'list'
    features[11] = node.name.toLowerCase().includes('list') ? 1 : 0;
    
    // Child count
    features[12] = Math.min(node.children?.length || 0, 10) / 10;
    
    // Has border/stroke
    features[13] = node.properties?.strokes?.length > 0 ? 1 : 0;
    
    // Width/height ratio approximation
    const width = node.properties?.size?.width || 0;
    const height = node.properties?.size?.height || 0;
    features[14] = height > 0 ? Math.min(width / height, 5) / 5 : 0;
    
    // Additional features are left as 0 for future expansion
    
    return features;
  }
  
  /**
   * Parse LLM response into a structured format
   */
  private parseLLMResponse(response: string): Record<string, Array<{ id: string, confidence: number }>> {
    const result: Record<string, Array<{ id: string, confidence: number }>> = {
      button: [],
      input: [],
      card: [],
      list: [],
      other: []
    };
    
    try {
      // Try to find JSON blocks in the response
      const jsonMatch = response.match(/```json([\s\S]*?)```/) || 
                       response.match(/{[\s\S]*}/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[0].replace(/```json|```/g, '');
        const parsed = JSON.parse(jsonStr);
        
        // Handle different possible response formats
        if (parsed.patterns || parsed.categories || parsed.classifications) {
          const categories = parsed.patterns || parsed.categories || parsed.classifications;
          
          for (const [key, value] of Object.entries(categories)) {
            const patternType = key.toLowerCase();
            if (result[patternType]) {
              result[patternType] = (value as any[]).map(item => ({
                id: item.id || item.nodeId,
                confidence: item.confidence || 0.7
              }));
            }
          }
        } else if (Array.isArray(parsed)) {
          // Handle array format
          for (const item of parsed) {
            const patternType = item.type?.toLowerCase() || item.category?.toLowerCase();
            if (patternType && result[patternType]) {
              result[patternType].push({
                id: item.id || item.nodeId,
                confidence: item.confidence || 0.7
              });
            }
          }
        }
      } else {
        // Fallback: basic text parsing
        for (const patternType of Object.keys(result)) {
          const regex = new RegExp(`${patternType}[\\s\\S]*?\\bids?\\b[\\s\\S]*?([\\w-]+)`, 'i');
          const match = response.match(regex);
          
          if (match && match[1]) {
            const ids = match[1].split(/[\s,]+/).filter(id => id.trim().length > 0);
            result[patternType] = ids.map(id => ({ id, confidence: 0.6 }));
          }
        }
      }
    } catch (error) {
      Logger.error('Error parsing LLM response:', error);
    }
    
    return result;
  }
  
  /**
   * Check if a node has a text child
   */
  private hasTextChild(node: FigmaNode): boolean {
    if (!node.children || node.children.length === 0) return false;
    
    // If node.children is an array of IDs, we can't check directly
    // In a real implementation, we'd have access to the full nodes
    // This is a simplified version
    return node.children.some(child => 
      typeof child === 'string' 
        ? child.includes('text') // Heuristic based on ID 
        : (child as any)?.type === 'TEXT'
    );
  }
  
  /**
   * Learn from past errors to improve pattern detection
   */
  public async learnFromErrors(errors: any[]): Promise<void> {
    if (!this.model || errors.length < 5) {
      Logger.info('Not enough data for model training');
      return;
    }
    
    try {
      // In a real implementation, we would:
      // 1. Extract node features and correct labels from error data
      // 2. Create a training dataset
      // 3. Fine-tune the model on the new data
      
      // This is a simplified example of retraining
      Logger.info('Learning from pattern detection errors...');
      
      // For now, we'll just simulate a training step
      await this.model.fit(
        tf.randomNormal([errors.length, 20]),
        tf.randomUniform([errors.length, 5]),
        {
          epochs: 5,
          batchSize: Math.min(errors.length, 32),
          callbacks: {
            onEpochEnd: (epoch: number, logs: any) => {
              Logger.debug(`Training epoch ${epoch + 1}, loss: ${logs.loss.toFixed(4)}`);
            }
          }
        }
      );
      
      Logger.info('Pattern detector model updated');
    } catch (error) {
      Logger.error('Error learning from pattern detection errors:', error);
    }
  }
}

