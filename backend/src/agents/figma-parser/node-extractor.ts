import { FigmaFile, FigmaNode } from '../../types/figma.types';
import { Logger } from '../../config/logger';

export class NodeExtractor {
  private skipNodeTypes: Set<string>;
  private maxDepth: number;
  
  constructor() {
    // Node types that aren't typically useful for code generation
    this.skipNodeTypes = new Set(['DOCUMENT', 'CANVAS', 'SLICE']);
    this.maxDepth = 50; // Prevent infinite recursion
    
    Logger.info('NodeExtractor initialized');
  }
  
  /**
   * Extract all nodes from a Figma file
   */
  public async extractNodes(figmaFile: FigmaFile): Promise<FigmaNode[]> {
    const nodes: FigmaNode[] = [];
    const document = (figmaFile as any).document;
    
    if (!document) {
      throw new Error('Invalid Figma file: missing document property');
    }
    
    await this.processNode(document, nodes);
    
    Logger.info(`Extracted ${nodes.length} nodes from Figma file`);
    return nodes;
  }
  
  /**
   * Process a node and its children recursively
   */
  private async processNode(node: any, nodes: FigmaNode[], depth = 0): Promise<void> {
    // Skip certain node types or if max depth reached
    if (this.skipNodeTypes.has(node.type) || depth > this.maxDepth) {
      return;
    }
    
    // Add the current node
    const processedNode: FigmaNode = {
      id: node.id,
      name: node.name,
      type: node.type,
      children: [],
      properties: this.extractNodeProperties(node)
    };
    
    nodes.push(processedNode);
    
    // Process children
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        await this.processNode(child, nodes, depth + 1);
        processedNode.children.push(child.id);
      }
    }
  }
  
  /**
   * Extract relevant properties from a node
   */
  private extractNodeProperties(node: any): Record<string, any> {
    const properties: Record<string, any> = {};
    
    // Extract common properties
    if (node.visible !== undefined) properties.visible = node.visible;
    if (node.locked !== undefined) properties.locked = node.locked;
    
    // Extract size and position
    if (node.absoluteBoundingBox) {
      properties.position = {
        x: node.absoluteBoundingBox.x,
        y: node.absoluteBoundingBox.y
      };
      
      properties.size = {
        width: node.absoluteBoundingBox.width,
        height: node.absoluteBoundingBox.height
      };
    }
    
    // Extract style-related properties
    if (node.fills) properties.fills = node.fills;
    if (node.strokes) properties.strokes = node.strokes;
    if (node.strokeWeight) properties.strokeWeight = node.strokeWeight;
    if (node.cornerRadius) properties.cornerRadius = node.cornerRadius;
    
    // Extract text-specific properties
    if (node.type === 'TEXT') {
      if (node.characters) properties.text = node.characters;
      if (node.style) properties.textStyle = node.style;
    }
    
    // Extract component-specific properties
    if (node.type === 'COMPONENT' || node.type === 'INSTANCE') {
      if (node.componentId) properties.componentId = node.componentId;
    }
    
    return properties;
  }
  
  /**
   * Create a flattened node structure for easier processing
   */
  public async flattenNodeStructure(figmaFile: FigmaFile): Promise<FigmaNode[]> {
    const nodes = await this.extractNodes(figmaFile);
    const nodeMap = new Map<string, FigmaNode>();
    
    // Create a map of all nodes by ID
    for (const node of nodes) {
      nodeMap.set(node.id, { ...node });
    }
    
    // Connect parent references
    for (const node of nodes) {
      for (const childId of node.children) {
        const child = nodeMap.get(childId);
        if (child) {
          child.parent = node.id;
        }
      }
    }
    
    return Array.from(nodeMap.values());
  }
  
  /**
   * Learn from past errors to improve extraction
   */
  public async learnFromErrors(errors: any[]): Promise<void> {
    // Analyze error patterns
    const skipTypes = new Set<string>();
    let adjustMaxDepth = false;
    
    for (const error of errors) {
      const errorMsg = error.data.error || '';
      
      // Look for patterns in errors
      if (errorMsg.includes('maximum call stack') || errorMsg.includes('recursion')) {
        adjustMaxDepth = true;
      }
      
      // Look for problem node types
      const typeMatch = errorMsg.match(/type '([A-Z_]+)'/);
      if (typeMatch && typeMatch[1]) {
        skipTypes.add(typeMatch[1]);
      }
    }
    
    // Apply learnings
    if (adjustMaxDepth) {
      this.maxDepth = Math.max(10, this.maxDepth - 5); // Reduce max depth, but not below 10
      Logger.info(`Adjusted maxDepth to ${this.maxDepth} based on learning`);
    }
    
    // Add problematic node types to skip list
    for (const type of skipTypes) {
      this.skipNodeTypes.add(type);
      Logger.info(`Added node type '${type}' to skip list based on learning`);
    }
  }
}
