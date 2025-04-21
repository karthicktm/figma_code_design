// src/modules/code-generation/component-selector.tsx
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RecognizedComponent } from '@/types/agent-interfaces';

interface ComponentSelectorProps {
  componentsList: RecognizedComponent[];
  onSelectNode: (nodeId: string | null) => void;
}

export function ComponentSelector({ componentsList, onSelectNode }: ComponentSelectorProps) {
  const [nodeId, setNodeId] = useState('');
  const [selectedComponent, setSelectedComponent] = useState<RecognizedComponent | null>(null);
  
  const handleFindComponent = () => {
    if (!nodeId) {
      onSelectNode(null); // Use all components
      setSelectedComponent(null);
      return;
    }
    
    const found = componentsList.find(c => c.id === nodeId);
    if (found) {
      setSelectedComponent(found);
      onSelectNode(nodeId);
    } else {
      // Not found - show an error or reset
      setSelectedComponent(null);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="node-id">Figma Node ID (Optional)</Label>
          <Input
            id="node-id"
            placeholder="Enter Figma node ID to target a specific component"
            value={nodeId}
            onChange={(e) => setNodeId(e.target.value)}
          />
          <p className="text-xs text-gray-500">
            Leave empty to generate code for all components
          </p>
        </div>
        <Button onClick={handleFindComponent} variant="secondary">
          {nodeId ? 'Find Component' : 'Use All Components'}
        </Button>
      </div>
      
      {selectedComponent && (
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="font-medium mb-2">Selected Component</h3>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Name:</span> {selectedComponent.name}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Type:</span> {selectedComponent.edsComponentType || 'Unknown'}
          </p>
        </div>
      )}
      
      {nodeId && !selectedComponent && (
        <div className="bg-amber-50 p-4 rounded-md text-amber-800">
          <h3 className="font-medium mb-2">Component Not Found</h3>
          <p className="text-sm">
            No component found with ID: {nodeId}
          </p>
          <p className="text-sm mt-1">
            Please check the ID and try again, or leave empty to generate code for all components.
          </p>
        </div>
      )}
      
      {!nodeId && (
        <div className="bg-blue-50 p-4 rounded-md text-blue-800">
          <h3 className="font-medium mb-2">All Components Selected</h3>
          <p className="text-sm">
            Code will be generated for all {componentsList.length} components.
          </p>
          <p className="text-sm mt-1">
            Enter a specific node ID if you want to generate code for only one component.
          </p>
        </div>
      )}
      
      <div className="mt-4">
        <Label>Available Components</Label>
        <div className="mt-2 max-h-48 overflow-y-auto border rounded-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Component Name
                </th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Node ID
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {componentsList.map((component, index) => (
                <tr 
                  key={index} 
                  className={`hover:bg-gray-50 cursor-pointer ${selectedComponent?.id === component.id ? 'bg-blue-50' : ''}`}
                  onClick={() => {
                    setNodeId(component.id);
                    setSelectedComponent(component);
                    onSelectNode(component.id);
                  }}
                >
                  <td className="px-4 py-2 text-sm">{component.name}</td>
                  <td className="px-4 py-2 text-sm">{component.edsComponentType || 'Unknown'}</td>
                  <td className="px-4 py-2 text-sm font-mono text-xs truncate" title={component.id}>
                    {component.id}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}