// src/modules/style-extraction/styles-shadow-panel.tsx
import React from 'react';
import { ExtractedStyles } from '@/types/agent-interfaces';

interface StylesShadowPanelProps {
  shadows: ExtractedStyles['shadows'];
}

export function StylesShadowPanel({ shadows }: StylesShadowPanelProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {shadows.map((shadow, index) => (
          <div key={index} className="border rounded-md overflow-hidden">
            <div 
              className="h-24 w-full bg-white" 
              style={{ boxShadow: shadow.value }}
            />
            <div className="p-3 space-y-1">
              <div className="font-medium truncate" title={shadow.name}>
                {shadow.name}
              </div>
              <div className="text-sm text-gray-500 flex justify-between">
                <span className="font-mono text-xs truncate" title={shadow.value}>
                  {shadow.value}
                </span>
                <button 
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => navigator.clipboard.writeText(shadow.value)}
                  title="Copy shadow value"
                >
                  Copy
                </button>
              </div>
              {shadow.edsVariable && (
                <div className="text-xs text-gray-400 truncate" title={shadow.edsVariable}>
                  {shadow.edsVariable}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
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