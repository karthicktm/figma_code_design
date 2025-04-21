// src/components/module-navigation.tsx
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/store';

export function ModuleNavigation() {
  const { activeModule, setActiveModule } = useAppStore();
  
  const modules = [
    { id: 'design-input', name: 'Design Input' },
    { id: 'asset-manager', name: 'Asset Manager' },
    { id: 'component-recognition', name: 'Component Recognition' },
    { id: 'style-extraction', name: 'Style Extraction' },
    { id: 'code-generation', name: 'Code Generation' },
    { id: 'output-preview', name: 'Output & Preview' },
  ];
  
  return (
    <div className="mb-6">
      <Tabs value={activeModule} onValueChange={setActiveModule}>
        <TabsList className="grid grid-cols-6 w-full">
          {modules.map((module) => (
            <TabsTrigger key={module.id} value={module.id}>
              {module.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
} 
