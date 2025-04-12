import { Logger } from '../config/logger';
import { EDSMapperAgent } from '../agents/eds-mapper/mapper.agent';
import { HttpError } from '../api/middleware/error.middleware';
import { FigmaNode } from '../types/figma.types';
import { EDSComponent } from '../types/eds.types';
import { ComponentMapping } from '../types/mapping.types';

export class MappingService {
  private edsMapperAgent: EDSMapperAgent;
  
  constructor() {
    this.edsMapperAgent = new EDSMapperAgent({
      name: 'EDS Mapper'
    });
  }
  
  /**
   * Create mappings between Figma components and EDS components
   */
  public async createMappings(
    figmaComponents: FigmaNode[], 
    edsComponents: EDSComponent[]
  ): Promise<ComponentMapping[]> {
    try {
      Logger.info(`Creating mappings between ${figmaComponents.length} Figma components and ${edsComponents.length} EDS components`);
      
      // Use the EDS Mapper Agent to create the mappings
      const mappingResult = await this.edsMapperAgent.execute({
        figmaComponents,
        edsComponents
      });
      
      return mappingResult.mappings;
    } catch (error) {
      Logger.error('Error creating component mappings:', error);
      throw new HttpError(500, `Failed to create component mappings: ${error.message}`);
    }
  }
  
  /**
   * Update existing component mappings
   */
  public async updateMappings(
    existingMappings: ComponentMapping[],
    updatedMapping: Partial<ComponentMapping>
  ): Promise<ComponentMapping[]> {
    try {
      if (!updatedMapping.figmaComponent?.id) {
        throw new HttpError(400, 'Missing Figma component ID in updated mapping');
      }
      
      // Find the mapping to update
      const mappingIndex = existingMappings.findIndex(
        mapping => mapping.figmaComponent.id === updatedMapping.figmaComponent?.id
      );
      
      if (mappingIndex === -1) {
        throw new HttpError(404, 'Mapping not found');
      }
      
      // Update the mapping
      const newMappings = [...existingMappings];
      newMappings[mappingIndex] = {
        ...newMappings[mappingIndex],
        ...updatedMapping,
        confidence: 1.0 // Manual update gets full confidence
      };
      
      return newMappings;
    } catch (error) {
      Logger.error('Error updating component mappings:', error);
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(500, `Failed to update component mappings: ${error.message}`);
    }
  }
}
