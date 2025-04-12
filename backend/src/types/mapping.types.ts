import { FigmaNode } from './figma.types';
import { EDSComponent } from './eds.types';

export interface ComponentMapping {
  figmaComponent: FigmaNode;
  edsComponent: EDSComponent;
  properties: Record<string, any>;
  confidence: number;
}

export interface MappingRequest {
  figmaComponents: FigmaNode[];
  edsComponents: EDSComponent[];
}

export interface MappingResult {
  mappings: ComponentMapping[];
  unmappedFigmaComponents: FigmaNode[];
  unmappedEDSComponents: EDSComponent[];
} 
