// components/eds-import/component-browser.tsx
'use client';

import { useState } from 'react';
import { useEDS } from '@/contexts/eds-context';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ComponentBrowser() {
  const { edsData } = useEDS();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['all']));
  
  if (!edsData || !edsData.components || edsData.components.length === 0) {
    return <div className="text-center py-6">No components found in the library.</div>;
  }
  
  // Group components by category
  const componentsByCategory: Record<string, any[]> = {};
  edsData.components.forEach(component => {
    const category = component.category || 'Uncategorized';
    if (!componentsByCategory[category]) {
      componentsByCategory[category] = [];
    }
    componentsByCategory[category].push(component);
  });
  
  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };
  
  return (
    <div className="space-y-2">
      {Object.entries(componentsByCategory).map(([category, components]) => (
        <div key={category} className="border rounded-md overflow-hidden">
          <div 
            className="flex items-center justify-between p-2 bg-muted cursor-pointer"
            onClick={() => toggleCategory(category)}
          >
            <span className="font-medium">{category}</span>
            <div className="flex items-center">
              <Badge variant="outline">{components.length}</Badge>
              {expandedCategories.has(category) ? (
                <ChevronDown className="h-4 w-4 ml-2" />
              ) : (
                <ChevronRight className="h-4 w-4 ml-2" />
              )}
            </div>
          </div>
          
          {expandedCategories.has(category) && (
            <div className="divide-y">
              {components.map((component) => (
                <div key={component.id} className="flex items-center justify-between p-3 hover:bg-muted/50">
                  <div>
                    <h4 className="font-medium">{component.name}</h4>
                    <p className="text-xs text-muted-foreground">{component.description}</p>
                  </div>
                  <div className="flex gap-2">
                    {component.properties && Object.keys(component.properties).length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {Object.keys(component.properties).length} Properties
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}