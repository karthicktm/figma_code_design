// src/modules/style-extraction/styles-color-panel.tsx
import React, { useState } from 'react';
import { ExtractedStyles } from '@/types/agent-interfaces';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface StylesColorPanelProps {
  colors: ExtractedStyles['colors'];
}

export function StylesColorPanel({ colors }: StylesColorPanelProps) {
  const [filter, setFilter] = useState('');
  
  const filteredColors = colors.filter(color => 
    color.name.toLowerCase().includes(filter.toLowerCase()) ||
    color.value.toLowerCase().includes(filter.toLowerCase()) ||
    color.edsVariable.toLowerCase().includes(filter.toLowerCase())
  );
  
  // Group colors into categories
  const groupColors = () => {
    const groups: Record<string, ExtractedStyles['colors']> = {
      'Primary': [],
      'Secondary': [],
      'Accent': [],
      'Semantic': [],
      'UI': [],
      'Other': []
    };
    
    filteredColors.forEach(color => {
      // Categorize by name
      const name = color.name.toLowerCase();
      
      if (name.includes('primary')) {
        groups['Primary'].push(color);
      } else if (name.includes('secondary')) {
        groups['Secondary'].push(color);
      } else if (name.includes('accent')) {
        groups['Accent'].push(color);
      } else if (
        name.includes('success') || 
        name.includes('error') || 
        name.includes('warning') || 
        name.includes('info') ||
        name.includes('danger')
      ) {
        groups['Semantic'].push(color);
      } else if (
        name.includes('background') || 
        name.includes('foreground') || 
        name.includes('card') || 
        name.includes('border') ||
        name.includes('muted')
      ) {
        groups['UI'].push(color);
      } else {
        groups['Other'].push(color);
      }
    });
    
    // Filter out empty groups
    return Object.entries(groups).filter(([_, colors]) => colors.length > 0);
  };
  
  const colorGroups = groupColors();
  
  return (
    <div className="space-y-6">
      <div className="mb-4">
        <Label htmlFor="filter-colors">Filter Colors</Label>
        <Input
          id="filter-colors"
          placeholder="Search colors..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-md"
        />
      </div>
      
      {colorGroups.length === 0 && (
        <div className="text-center p-8 border rounded-md bg-gray-50">
          <p className="text-gray-500">No colors found</p>
        </div>
      )}
      
      {colorGroups.map(([groupName, groupColors]) => (
        <div key={groupName} className="space-y-3">
          <h3 className="text-lg font-medium">{groupName} Colors</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {groupColors.map((color, index) => (
              <div key={index} className="border rounded-md overflow-hidden">
                <div 
                  className="h-24 w-full" 
                  style={{ backgroundColor: color.value }}
                />
                <div className="p-3 space-y-1">
                  <div className="font-medium truncate" title={color.name}>
                    {color.name}
                  </div>
                  <div className="text-sm text-gray-500 flex justify-between">
                    <span>{color.value}</span>
                    <button 
                      className="text-gray-400 hover:text-gray-600"
                      onClick={() => navigator.clipboard.writeText(color.value)}
                      title="Copy color value"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="text-xs text-gray-400 truncate" title={color.edsVariable}>
                    {color.edsVariable}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}