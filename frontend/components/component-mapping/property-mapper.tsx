 // components/component-mapping/property-mapper.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FigmaNode, EDSComponent } from '@/lib/types';

interface PropertyMapperProps {
  edsComponent: EDSComponent;
  figmaComponent: FigmaNode;
  initialProperties?: Record<string, any>;
  onChange: (properties: Record<string, any>) => void;
}

export function PropertyMapper({
  edsComponent,
  figmaComponent,
  initialProperties = {},
  onChange
}: PropertyMapperProps) {
  const [properties, setProperties] = useState<Record<string, any>>(initialProperties);
  
  // Update parent when properties change
  useEffect(() => {
    onChange(properties);
  }, [properties, onChange]);
  
  // Helper function to update a property
  const updateProperty = (name: string, value: any) => {
    setProperties(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // No properties to map
  if (!edsComponent.properties || Object.keys(edsComponent.properties).length === 0) {
    return (
      <div className="mt-4 text-center py-4 text-muted-foreground">
        No properties to map for this component.
      </div>
    );
  }
  
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Property Mapping</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(edsComponent.properties).map(([propName, propOptions]) => (
            <div key={propName} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                <Label htmlFor={propName}>{propName}</Label>
              </div>
              <div>
                {Array.isArray(propOptions) ? (
                  // For enum-type properties, show a dropdown
                  <Select
                    value={properties[propName] || ''}
                    onValueChange={(value) => updateProperty(propName, value)}
                  >
                    <SelectTrigger id={propName}>
                      <SelectValue placeholder={`Select ${propName}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {propOptions.map((option) => (
                        <SelectItem 
                          key={typeof option === 'string' ? option : JSON.stringify(option)} 
                          value={typeof option === 'string' ? option : JSON.stringify(option)}
                        >
                          {typeof option === 'string' ? option : JSON.stringify(option)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : typeof propOptions === 'boolean' ? (
                  // For boolean properties, show a checkbox
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={propName}
                      checked={properties[propName] || false}
                      onCheckedChange={(checked) => updateProperty(propName, checked)}
                    />
                    <Label htmlFor={propName}>Enabled</Label>
                  </div>
                ) : (
                  // For other properties, show an input
                  <Input
                    id={propName}
                    value={properties[propName] || ''}
                    onChange={(e) => updateProperty(propName, e.target.value)}
                    placeholder={`Enter ${propName}`}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
