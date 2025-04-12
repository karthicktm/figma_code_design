 // lib/api-client.ts
/**
 * API client for communication with the backend
 */
export class ApiClient {
    private baseUrl: string;
    
    constructor() {
      this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    }
    
    /**
     * Make a GET request to the API
     */
    public async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
      // Add query parameters if provided
      const url = params 
        ? `${this.baseUrl}${endpoint}?${new URLSearchParams(params)}` 
        : `${this.baseUrl}${endpoint}`;
        
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    }
    
    /**
     * Make a POST request to the API
     */
    public async post<T>(endpoint: string, data: any): Promise<T> {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} ${response.statusText}\n${errorText}`);
      }
      
      return response.json();
    }
    
    /**
     * Make a PUT request to the API
     */
    public async put<T>(endpoint: string, data: any): Promise<T> {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    }
    
    /**
     * Make a DELETE request to the API
     */
    public async delete<T>(endpoint: string): Promise<T> {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    }
    
    // Figma-related API methods
    
    /**
     * Import a Figma file
     */
    public async importFigmaFile(data: any) {
      return this.post('/figma/import', data);
    }
    
    /**
     * Analyze a Figma design
     */
    public async analyzeFigmaDesign(data: any) {
      return this.post('/figma/analyze', data);
    }
    
    // EDS-related API methods
    
    /**
     * Import an EDS library
     */
    public async importEDSLibrary(data: any) {
      return this.post('/eds/import', data);
    }
    
    // Mapping-related API methods
    
    /**
     * Create component mappings
     */
    public async createMappings(data: any) {
      return this.post('/mapping/create', data);
    }
    
    /**
     * Update component mappings
     */
    public async updateMappings(data: any) {
      return this.put('/mapping/update', data);
    }
    
    // Generation-related API methods
    
    /**
     * Generate code based on mappings
     */
    public async generateCode(data: any) {
      return this.post('/generation/generate', data);
    }
    
    // Validation-related API methods
    
    /**
     * Validate generated code
     */
    public async validateCode(data: any) {
      return this.post('/validation/validate', data);
    }
  }
  
  // Create a singleton instance of the API client
  export const apiClient = new ApiClient();
