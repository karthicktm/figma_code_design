// src/modules/style-extraction/styles-spacing-panel.tsx
import React from 'react';
import { ExtractedStyles } from '@/types/agent-interfaces';

interface StylesSpacingPanelProps {
  spacing: ExtractedStyles['spacing'];
  breakpoints: ExtractedStyles['breakpoints'];
}

export function StylesSpacingPanel({ spacing, breakpoints }: StylesSpacingPanelProps) {
  return (
    <div className="space-y-8">
      {/* Spacing Tokens */}
      <div>
        <h3 className="text-lg font-medium mb-4">Spacing Tokens</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {spacing.map((space, index) => (
            <div key={index} className="border rounded-md p-4">
              <div className="mb-3">
                <div className="font-medium text-sm text-gray-500">{space.name}</div>
                <div 
                  className="mt-2 bg-blue-100 border border-blue-200" 
                  style={{ width: space.value, height: space.value }}
                />
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Value</span>
                  <span className="font-mono">{space.value}</span>
                </div>
                {space.edsVariable && (
                  <div className="flex justify-between text-gray-600">
                    <span>Variable</span>
                    <span className="font-mono">{space.edsVariable}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Breakpoints */}
      {breakpoints && breakpoints.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4">Breakpoints</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {breakpoints.map((breakpoint, index) => (
              <div key={index} className="border rounded-md p-4">
                <div className="mb-3">
                  <div className="font-medium text-sm text-gray-500">{breakpoint.name}</div>
                  <div className="mt-2 text-lg">{breakpoint.value}</div>
                </div>
                {breakpoint.edsVariable && (
                  <div className="text-sm flex justify-between text-gray-600">
                    <span>Variable</span>
                    <span className="font-mono">{breakpoint.edsVariable}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}