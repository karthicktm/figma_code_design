import { Logger } from '../config/logger';
import { HttpError } from '../api/middleware/error.middleware';
import { EDSLibrary } from '../types/eds.types';

export class EDSService {
  /**
   * Import an EDS library
   */
  public async importEDSLibrary(edsData: any): Promise<EDSLibrary> {
    try {
      Logger.info('Importing EDS library');
      
      // Basic validation
      if (!edsData.components || !Array.isArray(edsData.components)) {
        throw new HttpError(400, 'Invalid EDS library: Missing or invalid components array');
      }
      
      // Format the library data
      const library: EDSLibrary = {
        name: edsData.name || 'Untitled EDS Library',
        version: edsData.version || '1.0.0',
        components: edsData.components.map((component: any) => {
          // Ensure each component has the required fields
          if (!component.id || !component.name) {
            throw new HttpError(400, 'Invalid component: Missing id or name');
          }
          
          return {
            id: component.id,
            name: component.name,
            type: component.type || 'unknown',
            description: component.description || '',
            category: component.category || 'Uncategorized',
            properties: component.properties || {}
          };
        })
      };
      
      return library;
    } catch (error) {
      Logger.error('Error importing EDS library:', error);
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(500, `Failed to import EDS library: ${error.message}`);
    }
  }
} 
