import { Logger } from '../../config/logger';

interface MemoryOptions {
  agentId: string;
  maxItems: number;
}

interface MemoryItem {
  key: string;
  data: any;
  timestamp: number;
  accessCount: number;
  lastAccessed?: number;
}

export class AgentMemory {
  private agentId: string;
  private maxItems: number;
  private store: Map<string, MemoryItem>;
  
  constructor(options: MemoryOptions) {
    this.agentId = options.agentId;
    this.maxItems = options.maxItems;
    this.store = new Map<string, MemoryItem>();
    
    Logger.info(`Memory initialized for agent ${this.agentId} with max ${this.maxItems} items`);
  }
  
  public async add(key: string, data: any): Promise<void> {
    // Check if we need to make room
    if (this.store.size >= this.maxItems && !this.store.has(key)) {
      this.evictLeastUsed();
    }
    
    const timestamp = Date.now();
    
    // Update existing item or add new one
    if (this.store.has(key)) {
      const item = this.store.get(key)!;
      item.data = data;
      item.timestamp = timestamp;
      item.accessCount += 1;
      this.store.set(key, item);
    } else {
      this.store.set(key, {
        key,
        data,
        timestamp,
        accessCount: 1
      });
    }
  }
  
  /**
   * Retrieve an item from memory
   */
  public async get(key: string): Promise<any> {
    if (!this.store.has(key)) {
      return null;
    }
    
    const item = this.store.get(key)!;
    
    // Update access info
    item.accessCount += 1;
    item.lastAccessed = Date.now();
    
    return item.data;
  }
  
  /**
   * Check if an item exists in memory
   */
  public async has(key: string): Promise<boolean> {
    return this.store.has(key);
  }
  
  /**
   * Remove an item from memory
   */
  public async remove(key: string): Promise<boolean> {
    return this.store.delete(key);
  }
  
  /**
   * Clear all items from memory
   */
  public async clear(): Promise<void> {
    this.store.clear();
  }
  
  /**
   * Get the number of items in memory
   */
  public size(): number {
    return this.store.size;
  }
  
  /**
   * Get all keys in memory
   */
  public keys(): string[] {
    return Array.from(this.store.keys());
  }
  
  /**
   * Evict the least used item from memory
   */
  private evictLeastUsed(): void {
    if (this.store.size === 0) return;
    
    let leastUsedKey: string | null = null;
    let leastUsedCount = Infinity;
    
    // Find the least used item
    for (const [key, item] of this.store.entries()) {
      if (item.accessCount < leastUsedCount) {
        leastUsedCount = item.accessCount;
        leastUsedKey = key;
      }
    }
    
    if (leastUsedKey) {
      Logger.debug(`Evicting least used memory item: ${leastUsedKey}`);
      this.store.delete(leastUsedKey);
    }
  }
}