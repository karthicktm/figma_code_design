// contexts/eds-context.tsx
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { EDSLibrary, EDSComponent } from '@/lib/types';
import { toast } from "sonner";
import { apiClient } from '@/lib/api-client';
import { useWorkflow } from './workflow-context';

interface EDSContextType {
  edsData: EDSLibrary | null;
  isLoading: boolean;
  importEDSLibrary: (data: any) => Promise<void>;
}

const EDSContext = createContext<EDSContextType | undefined>(undefined);

interface EDSProviderProps {
  children: ReactNode;
}

export function EDSProvider({ children }: EDSProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { edsData, setEDSData } = useWorkflow();
  //const { toast } = useToast();
  
  /**
   * Import an EDS library from a JSON object
   */
  const importEDSLibrary = async (data: any) => {
    setIsLoading(true);
    
    try {
      // Validate the data structure
      if (!data.components || !Array.isArray(data.components)) {
        throw new Error('Invalid EDS library format: missing components array');
      }
      
      // Create an EDSLibrary object
      const library: EDSLibrary = {
        name: data.name || 'Untitled EDS Library',
        version: data.version || '1.0.0',
        components: data.components.map((component: any) => {
          // Ensure each component has the required fields
          if (!component.id || !component.name) {
            throw new Error('Invalid component format: missing id or name');
          }
          
          return {
            id: component.id,
            name: component.name,
            type: component.type || 'unknown',
            description: component.description || '',
            category: component.category || 'Uncategorized',
            properties: component.properties || {}
          } as EDSComponent;
        })
      };
      
      // Update the workflow context
      setEDSData(library);
      
      // Also send to backend for processing
      await apiClient.importEDSLibrary(library);
      
      toast.success(`Imported "${library.name}" with ${library.components.length} components.`)
    } catch (error) {
      console.error('Error importing EDS library:', error);
      toast.error(`Failed to import the EDS library: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <EDSContext.Provider value={{
      edsData,
      isLoading,
      importEDSLibrary
    }}>
      {children}
    </EDSContext.Provider>
  );
}

export function useEDS() {
  const context = useContext(EDSContext);
  if (context === undefined) {
    throw new Error('useEDS must be used within an EDSProvider');
  }
  return context;
}