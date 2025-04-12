 'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Link as LinkIcon } from 'lucide-react';
import { useEDS } from '@/contexts/eds-context';
import { useFigma } from '@/contexts/figma-context';
import { useWorkflow } from '@/contexts/workflow-context';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function ComponentMapping() {
  const { edsData } = useEDS();
  const { analyzedData, figmaComponents } = useFigma();
  const { completeStep } = useWorkflow();
  const router = useRouter();
  const { toast } = useToast();
  const [mappings, setMappings] = useState<Record<string, any>>({});
  const [selectedFigmaComponent, setSelectedFigmaComponent] = useState<any>(null);
  const [selectedEDSComponent, setSelectedEDSComponent] = useState<any>(null);
  const [searchFigma, setSearchFigma] = useState('');
  const [searchEDS, setSearchEDS] = useState('');
  
  useEffect(() => {
    if (!edsData) {
      router.push('/eds-import');
    }
  }, [edsData, router]);
  
  // Simulate loading automatic mappings
  useEffect(() => {
    if (figmaComponents && edsData) {
      // This would be replaced with actual mapping logic/API call
      const autoMappings: Record<string, any> = {};
      
      // Simulate automatic mappings with confidence scores
      figmaComponents.slice(0, 5).forEach((component, index) => {
        const matchingEDSComponent = edsData.components[index % edsData.components.length];
        if (matchingEDSComponent) {
          autoMappings[component.id] = {
            figmaComponent: component,
            edsComponent: matchingEDSComponent,
            confidence: Math.random() * 0.5 + 0.5, // Random confidence score between 0.5 and 1.0
            properties: {}
          };
        }
      });
      
      setMappings(autoMappings);
    }
  }, [figmaComponents, edsData]);
  
  const handleCreateMapping = () => {
    if (!selectedFigmaComponent || !selectedEDSComponent) {
      toast({
        title: "Selection required",
        description: "Please select both a Figma component and an EDS component.",
        variant: "destructive",
      });
      return;
    }
    
    setMappings({
      ...mappings,
      [selectedFigmaComponent.id]: {
        figmaComponent: selectedFigmaComponent,
        edsComponent: selectedEDSComponent,
        confidence: 1.0, // Manual mapping gets full confidence
        properties: {}
      }
    });
    
    toast({
      title: "Mapping created",
      description: `Mapped "${selectedFigmaComponent.name}" to "${selectedEDSComponent.name}".`,
    });
    
    // Reset selections
    setSelectedFigmaComponent(null);
    setSelectedEDSComponent(null);
  };
  
  const handleContinue = () => {
    if (Object.keys(mappings).length > 0) {
      completeStep('mapping');
      router.push('/generation');
    } else {
      toast({
        title: "No mappings created",
        description: "Please create at least one component mapping before continuing.",
        variant: "destructive",
      });
    }
  };
  
  if (!edsData || !figmaComponents) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  const filteredFigmaComponents = figmaComponents.filter(
    component => component.name.toLowerCase().includes(searchFigma.toLowerCase())
  );
  
  const filteredEDSComponents = edsData.components.filter(
    component => component.name.toLowerCase().includes(searchEDS.toLowerCase())
  );
  
  // Calculate mapping progress
  const mappingProgress = (Object.keys(mappings).length / figmaComponents.length) * 100;
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Component Mapping</h1>
        <p className="text-muted-foreground">Map Figma components to your EDS components.</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Mapping Progress</CardTitle>
          <CardDescription>
            {Object.keys(mappings).length} of {figmaComponents.length} components mapped ({Math.round(mappingProgress)}%)
          </CardDescription>
          <Progress value={mappingProgress} className="mt-2" />
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle>Figma Components</CardTitle>
            <CardDescription>
              Select a component from your Figma design.
            </CardDescription>
            <div className="relative mt-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search Figma components..." 
                className="pl-8"
                value={searchFigma}
                onChange={(e) => setSearchFigma(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <div className="space-y-2">
              {filteredFigmaComponents.map(component => {
                const isSelected = selectedFigmaComponent?.id === component.id;
                const isMapped = component.id in mappings;
                
                return (
                  <div
                    key={component.id}
                    className={`p-3 border rounded-md cursor-pointer ${
                      isSelected ? 'border-primary bg-primary/10' : 
                      isMapped ? 'border-green-500 bg-green-500/10' : 
                      'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedFigmaComponent(component)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{component.name}</h4>
                        <p className="text-xs text-muted-foreground">ID: {component.id.slice(0, 8)}...</p>
                      </div>
                      {isMapped && (
                        <Badge variant="outline" className="bg-green-500/20 border-green-500 text-green-700">
                          Mapped
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        
        <Card className="h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle>EDS Components</CardTitle>
            <CardDescription>
              Select a component from your Enterprise Design System.
            </CardDescription>
            <div className="relative mt-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search EDS components..." 
                className="pl-8"
                value={searchEDS}
                onChange={(e) => setSearchEDS(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <div className="space-y-2">
              {filteredEDSComponents.map(component => {
                const isSelected = selectedEDSComponent?.id === component.id;
                
                return (
                  <div
                    key={component.id}
                    className={`p-3 border rounded-md cursor-pointer ${
                      isSelected ? 'border-primary bg-primary/10' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedEDSComponent(component)}
                  >
                    <h4 className="font-medium">{component.name}</h4>
                    <p className="text-xs text-muted-foreground">{component.description}</p>
                    {component.properties && Object.keys(component.properties).length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {Object.keys(component.properties).map(prop => (
                          <Badge key={prop} variant="outline" className="text-xs">
                            {prop}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
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
            
            {/* Property mapping would go here for more complex scenarios */}
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
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => {
                        const newMappings = {...mappings};
                        delete newMappings[figmaId];
                        setMappings(newMappings);
                      }}
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
