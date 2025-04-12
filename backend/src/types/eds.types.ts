  // src/types/eds.types.ts
  export interface EDSComponent {
    id: string;
    name: string;
    type: string;
    description?: string;
    category?: string;
    properties?: Record<string, any[]>;
  }
  
  export interface EDSLibrary {
    name: string;
    version: string;
    components: EDSComponent[];
  } 
