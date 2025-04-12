 // components/component-mapping/component-picker.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FigmaNode, EDSComponent } from '@/lib/types';

interface ComponentPickerProps {
  title: string;
  components: (FigmaNode | EDSComponent)[];
  selectedComponent: FigmaNode | EDSComponent | null;
  onSelectComponent: (component: any) => void;
  mappedIds?: string[];
}

export function ComponentPicker({
  title,
  components,
  selectedComponent,
  onSelectComponent,
  mappedIds = []
}: ComponentPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter components based on search term
  const filteredComponents = useMemo(() => {
    if (!searchTerm) return components;
    
    return components.filter(component => 
      component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      component.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      component.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [components, searchTerm]);
  
  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Select a component from the list.
        </CardDescription>
        <div className="relative mt-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={`Search ${title.toLowerCase()}...`} 
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <div className="space-y-2">
          {filteredComponents.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No components found matching your search.
            </div>
          ) : (
            filteredComponents.map(component => {
              const isSelected = selectedComponent?.id === component.id;
              const isMapped = mappedIds.includes(component.id);
              const isEDSComponent = 'category' in component;
              
              return (
                <div
                  key={component.id}
                  className={`p-3 border rounded-md cursor-pointer ${
                    isSelected ? 'border-primary bg-primary/10' : 
                    isMapped ? 'border-green-500 bg-green-500/10' : 
                    'hover:bg-muted/50'
                  }`}
                  onClick={() => onSelectComponent(component)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{component.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        Type: {component.type}
                        {component.id && ` • ID: ${component.id.slice(0, 8)}...`}
                        {isEDSComponent && (component as EDSComponent).category && ` • Category: ${(component as EDSComponent).category}`}
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      {isMapped && (
                        <Badge variant="outline" className="bg-green-500/20 border-green-500 text-green-700">
                          Mapped
                        </Badge>
                      )}
                      
                      {isEDSComponent && (component as EDSComponent).properties && (
                        <div className="mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {Object.keys((component as EDSComponent).properties || {}).length} Properties
                          </Badge>
                        </div>
                      )}
                      
                      {!isEDSComponent && (component as FigmaNode).pattern && (
                        <div className="mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {(component as FigmaNode).pattern}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {isEDSComponent && (component as EDSComponent).description && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {(component as EDSComponent).description}
                      </p>
                  )}
                  
                  {isEDSComponent && (component as EDSComponent).properties && Object.keys((component as EDSComponent).properties!).length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {Object.keys((component as EDSComponent).properties!).map(prop => (
                        <Badge key={prop} variant="outline" className="text-xs">
                          {prop}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
