// src/modules/style-extraction/styles-shadow-panel.tsx
import React, { useState } from 'react';
import { ExtractedStyles } from '@/types/agent-interfaces';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface StylesShadowPanelProps {
  shadows: ExtractedStyles['shadows'];
}

export function StylesShadowPanel({ shadows }: StylesShadowPanelProps) {
  const [filter, setFilter] = useState('');
  
  const filteredShadows = shadows.filter(shadow => 
    shadow.name.toLowerCase().includes(filter.toLowerCase()) ||
    shadow.value.toLowerCase().includes(filter.toLowerCase()) ||
    shadow.edsVariable.toLowerCase().includes(filter.toLowerCase())
  );
  
  return (
    <div className="space-y-6">
      <div className="mb-4">
        <Label htmlFor="filter-shadows">Filter Shadows</Label>
        <Input
          id="filter-shadows"
          placeholder="Search shadows..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-md"
        />
      </div>
      
      {filteredShadows.length === 0 ? (
        <div className="text-center p-8 border rounded-md bg-gray-50">
          <p className="text-gray-500">No shadow tokens found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShadows.map((shadow, index) => (
            <div key={index} className="space-y-3">
              <div 
                className="h-32 bg-white rounded-lg flex items-center justify-center" 
                style={{ boxShadow: shadow.value }}
              >
                <span className="text-sm text-gray-500">{shadow.name}</span>
              </div>
              
              <div className="space-y-1">
                <div className="font-medium">{shadow.name}</div>
                <div className="text-sm overflow-hidden text-ellipsis">
                  <code className="text-xs bg-gray-100 p-1 rounded">{shadow.value}</code>
                </div>
                <div className="text-xs text-gray-400">{shadow.edsVariable}</div>
              </div>
              
              <button 
                className="text-xs text-blue-500 hover:text-blue-700"
                onClick={() => navigator.clipboard.writeText(shadow.value)}
              >
                Copy CSS
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-8 p-4 border rounded-md bg-gray-50">
        <h3 className="text-lg font-medium mb-3">Shadow Usage Guidelines</h3>
        <div className="space-y-3 text-sm">
          <p>
            <span className="font-medium">shadow-sm:</span> Subtle shadow for low-prominence elements, like form inputs.
          </p>
          <p>
            <span className="font-medium">shadow:</span> Default shadow for most UI elements like cards.
          </p>
          <p>
            <span className="font-medium">shadow-md:</span> Medium shadow for elements that need a bit more emphasis.
          </p>
          <p>
            <span className="font-medium">shadow-lg:</span> Large shadow for elevated elements like dropdowns and popovers.
          </p>
          <p>
            <span className="font-medium">shadow-xl:</span> Extra large shadow for highly elevated elements like modals.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            When implementing in Angular with EDS, use the corresponding CSS variables for consistent elevation throughout your application.
          </p>
        </div>
      </div>
    </div>
  );
}