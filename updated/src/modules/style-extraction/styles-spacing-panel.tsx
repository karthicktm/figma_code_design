// src/modules/style-extraction/styles-spacing-panel.tsx
import React, { useState } from 'react';
import { ExtractedStyles } from '@/types/agent-interfaces';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface StylesSpacingPanelProps {
  spacing: ExtractedStyles['spacing'];
  breakpoints: ExtractedStyles['breakpoints'];
}

export function StylesSpacingPanel({ spacing, breakpoints }: StylesSpacingPanelProps) {
  const [filter, setFilter] = useState('');
  
  const filteredSpacing = spacing.filter(item => 
    item.name.toLowerCase().includes(filter.toLowerCase()) ||
    item.value.toLowerCase().includes(filter.toLowerCase()) ||
    item.edsVariable.toLowerCase().includes(filter.toLowerCase())
  );
  
  const filteredBreakpoints = breakpoints.filter(item => 
    item.name.toLowerCase().includes(filter.toLowerCase()) ||
    item.value.toLowerCase().includes(filter.toLowerCase()) ||
    item.edsVariable.toLowerCase().includes(filter.toLowerCase())
  );
  
  return (
    <div className="space-y-8">
      <div className="mb-4">
        <Label htmlFor="filter-spacing">Filter Spacing & Breakpoints</Label>
        <Input
          id="filter-spacing"
          placeholder="Search spacing and breakpoints..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-md"
        />
      </div>
      
      {/* Spacing Tokens */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Spacing</h3>
        {filteredSpacing.length === 0 ? (
          <div className="text-center p-8 border rounded-md bg-gray-50">
            <p className="text-gray-500">No spacing tokens found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredSpacing.map((space, index) => {
              // Extract the numeric value for visualization
              const numericValue = parseInt(space.value);
              const sizeInPx = isNaN(numericValue) ? 16 : Math.min(128, Math.max(4, numericValue));
              
              return (
                <div key={index} className="border rounded-md p-4 space-y-2">
                  <div className="font-medium">{space.name}</div>
                  
                  <div className="flex items-center space-x-2">
                    <div 
                      className="bg-blue-200 rounded" 
                      style={{ 
                        width: `${sizeInPx}px`, 
                        height: '16px' 
                      }}
                    />
                    <span className="text-sm">{space.value}</span>
                  </div>
                  
                  <div className="text-xs text-gray-400 truncate" title={space.edsVariable}>
                    {space.edsVariable}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Breakpoint Tokens */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Breakpoints</h3>
        {filteredBreakpoints.length === 0 ? (
          <div className="text-center p-8 border rounded-md bg-gray-50">
            <p className="text-gray-500">No breakpoint tokens found</p>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-lg border">
            {/* Breakpoint visualization */}
            <div className="w-full bg-gray-100 h-16 relative">
              {filteredBreakpoints.map((breakpoint, index) => {
                // Extract pixel value for visualization
                const pxMatch = breakpoint.value.match(/(\d+)px/);
                const pxValue = pxMatch ? parseInt(pxMatch[1]) : 0;
                const maxWidth = 1400; // Max width for visualization
                const position = (pxValue / maxWidth) * 100;
                
                return (
                  <div 
                    key={index} 
                    className="absolute top-0 h-full border-l border-blue-500 flex items-center"
                    style={{ 
                      left: `${position}%`,
                      display: pxValue === 0 ? 'none' : 'flex'  // Hide the 0px breakpoint
                    }}
                  >
                    <div 
                      className="absolute -top-6 transform -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-1 rounded"
                    >
                      {breakpoint.name}: {breakpoint.value}
                    </div>
                  </div>
                );
              })}
              
              {/* Width markers */}
              <div className="absolute bottom-0 w-full h-4 flex justify-between px-2 text-xs text-gray-500">
                <span>0px</span>
                <span>480px</span>
                <span>768px</span>
                <span>992px</span>
                <span>1200px</span>
                <span>1400px</span>
              </div>
            </div>
            
            {/* Breakpoint details */}
            <div className="bg-white p-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EDS Variable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredBreakpoints.map((breakpoint, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{breakpoint.name}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{breakpoint.value}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{breakpoint.edsVariable}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}