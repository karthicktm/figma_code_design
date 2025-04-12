 'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Link as LinkIcon } from 'lucide-react';
import { ComponentPicker } from './component-picker';
import { PropertyMapper } from './property-mapper';
import { ComponentMapping, FigmaNode, EDSComponent } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';

interface MappingInterfaceProps {
  figmaComponents: FigmaNode[];
  edsComponents: EDSComponent[];
  existingMappings: Record<string, ComponentMapping>;
  onSaveMappings: (mappings: Record<string, ComponentMapping>) => void;
  onContinue: () => void;
}

export function MappingInterface({
  figmaComponents,
  edsComponents,
  existingMappings,
  onSaveMappings,
  onContinue
}: MappingInterfaceProps) {
  const [mappings, setMappings] = useState<Record<string, ComponentMapping>>(existingMappings || {});
  const [selectedFigmaComponent, setSelectedFigmaComponent] = useState<FigmaNode | null>(null);
  const [selectedEDSComponent, setSelectedEDSComponent] = useState<EDSComponent | null>(null);
  const [mappingProperties, setMappingProperties] = useState<Record<string, any>>({});
  const [mappingProgress, setMappingProgress] = useState<number>(0);
  const { toast } = useToast();
  
  // Update mapping progress when mappings change
  useEffect(() => {
    const progress = (Object.keys(mappings).length / figmaComponents.length) * 100;
    setMappingProgress(progress);
  }, [mappings, figmaComponents]);
  
  // Reset selected components when figma or eds components change
  useEffect(() => {
    setSelectedFigmaComponent(null);
    setSelectedEDSComponent(null);
    setMappingProperties({});
  }, [figmaComponents, edsComponents]);
  
  const handleCreateMapping = () => {
    if (!selectedFigmaComponent || !selectedEDSComponent) {
      toast({
        title: "Selection required",
        description: "Please select both a Figma component and an EDS component.",
        variant: "destructive",
      });
      return;
    }
    
    const newMappings = {
      ...mappings,
      [selectedFigmaComponent.id]: {
        figmaComponent: selectedFigmaComponent,
        edsComponent: selectedEDSComponent,
        properties: mappingProperties,
        confidence: 1.0 // Manual mapping gets full confidence
      }
    };
    
    setMappings(newMappings);
    onSaveMappings(newMappings);
    
    toast({
      title: "Mapping created",
      description: `Mapped "${selectedFigmaComponent.name}" to "${selectedEDSComponent.name}".`,
    });
    
    // Reset selections
    setSelectedFigmaComponent(null);
    setSelectedEDSComponent(null);
    setMappingProperties({});
  };
  
  const handleRemoveMapping = (figmaId: string) => {
    const newMappings = { ...mappings };
    delete newMappings[figmaId];
    
    setMappings(newMappings);
    onSaveMappings(newMappings);
    
    toast({
      title: "Mapping removed",
      description: "The component mapping has been removed.",
    });
  };
  
  const handleEditMapping = (figmaId: string) => {
    const mapping = mappings[figmaId];
    
    setSelectedFigmaComponent(mapping.figmaComponent);
    setSelectedEDSComponent(mapping.edsComponent);
    setMappingProperties(mapping.properties || {});
    
    // Remove the existing mapping (it will be recreated on save)
    const newMappings = { ...mappings };
    delete newMappings[figmaId];
    
    setMappings(newMappings);
    onSaveMappings(newMappings);
  };
  
  const handlePropertyChange = (properties: Record<string, any>) => {
    setMappingProperties(properties);
  };
  
  const handleContinue = () => {
    if (Object.keys(mappings).length === 0) {
      toast({
        title: "No mappings created",
        description: "Please create at least one component mapping before continuing.",
        variant: "destructive",
      });
      return;
    }
    
    onContinue();
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mapping Progress</CardTitle>
          <CardDescription>
            {Object.keys(mappings).length} of {figmaComponents.length} components mapped ({Math.round(mappingProgress)}%)
          </CardDescription>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${mappingProgress}%` }}
            ></div>
          </div>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ComponentPicker
          title="Figma Components"
          components={figmaComponents}
          selectedComponent={selectedFigmaComponent}
          onSelectComponent={setSelectedFigmaComponent}
          mappedIds={Object.keys(mappings)}
        />
        
        <ComponentPicker
          title="EDS Components"
          components={edsComponents}
          selectedComponent={selectedEDSComponent}
          onSelectComponent={setSelectedEDSComponent}
        />
      </div>
      
      {selectedFigmaComponent && selectedEDSComponent && (
        <Card>
          <CardHeader>
            <CardTitle>Create Mapping</CardTitle>
            <CardDescription>
              Map the selected components and their properties.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-4">
              <div className="p-3 border rounded-md flex-1">
                <h4 className="font-medium">{selectedFigmaComponent.name}</h4>
                <p className="text-xs text-muted-foreground">Figma Component</p>
              </div>
              <LinkIcon className="h-6 w-6 text-muted-foreground" />
              <div className="p-3 border rounded-md flex-1">
                <h4 className="font-medium">{selectedEDSComponent.name}</h4>
                <p className="text-xs text-muted-foreground">EDS Component</p>
              </div>
            </div>
            
            {selectedEDSComponent.properties && Object.keys(selectedEDSComponent.properties).length > 0 && (
              <PropertyMapper
                edsComponent={selectedEDSComponent}
                figmaComponent={selectedFigmaComponent}
                initialProperties={mappingProperties}
                onChange={handlePropertyChange}
              />
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleCreateMapping} className="w-full">
              Create Mapping
            </Button>
          </CardFooter>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Current Mappings</CardTitle>
          <CardDescription>
            Review and edit your component mappings.
          </CardDescription>
        </CardHeader>
        <CardContent className="max-h-96 overflow-auto">
          <div className="space-y-2">
            {Object.entries(mappings).map(([figmaId, mapping]) => (
              <div key={figmaId} className="p-3 border rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <h4 className="font-medium">{mapping.figmaComponent.name}</h4>
                      <p className="text-xs text-muted-foreground">Figma Component</p>
                    </div>
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">{mapping.edsComponent.name}</h4>
                      <p className="text-xs text-muted-foreground">EDS Component</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={mapping.confidence >= 0.8 ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {Math.round(mapping.confidence * 100)}% Confidence
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditMapping(figmaId)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleRemoveMapping(figmaId)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {Object.keys(mappings).length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                No mappings created yet. Select components above to create a mapping.
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleContinue} className="ml-auto">
            Continue to Code Generation
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
