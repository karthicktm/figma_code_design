// src/modules/style-extraction/styles-typography-panel.tsx
import React, { useState } from 'react';
import { ExtractedStyles } from '@/types/agent-interfaces';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface StylesTypographyPanelProps {
  typography: ExtractedStyles['typography'];
}

export function StylesTypographyPanel({ typography }: StylesTypographyPanelProps) {
  const [filter, setFilter] = useState('');
  
  const filteredTypography = typography.filter(type => 
    type.name.toLowerCase().includes(filter.toLowerCase()) ||
    type.fontFamily.toLowerCase().includes(filter.toLowerCase()) ||
    type.edsVariable.toLowerCase().includes(filter.toLowerCase())
  );
  
  // Group typography styles into categories
  const groupTypography = () => {
    const groups: Record<string, ExtractedStyles['typography']> = {
      'Headings': [],
      'Body': [],
      'Display': [],
      'UI Elements': [],
      'Other': []
    };
    
    filteredTypography.forEach(type => {
      const name = type.name.toLowerCase();
      
      if (
        name.includes('h1') || 
        name.includes('h2') || 
        name.includes('h3') || 
        name.includes('h4') || 
        name.includes('h5') || 
        name.includes('h6') || 
        name.includes('heading')
      ) {
        groups['Headings'].push(type);
      } else if (
        name.includes('body') || 
        name.includes('paragraph') || 
        name.includes('text')
      ) {
        groups['Body'].push(type);
      } else if (
        name.includes('display') || 
        name.includes('title') || 
        name.includes('hero')
      ) {
        groups['Display'].push(type);
      } else if (
        name.includes('button') || 
        name.includes('label') || 
        name.includes('caption') || 
        name.includes('input')
      ) {
        groups['UI Elements'].push(type);
      } else {
        groups['Other'].push(type);
      }
    });
    
    // Filter out empty groups
    return Object.entries(groups).filter(([_, types]) => types.length > 0);
  };
  
  const typographyGroups = groupTypography();
  
  return (
    <div className="space-y-6">
      <div className="mb-4">
        <Label htmlFor="filter-typography">Filter Typography</Label>
        <Input
          id="filter-typography"
          placeholder="Search typography styles..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-md"
        />
      </div>
      
      {typographyGroups.length === 0 && (
        <div className="text-center p-8 border rounded-md bg-gray-50">
          <p className="text-gray-500">No typography styles found</p>
        </div>
      )}
      
      {typographyGroups.map(([groupName, groupTypography]) => (
        <div key={groupName} className="space-y-3">
          <h3 className="text-lg font-medium">{groupName}</h3>
          <div className="space-y-4">
            {groupTypography.map((type, index) => (
              <div key={index} className="border rounded-md overflow-hidden p-4">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                  {/* Preview */}
                  <div className="flex-1">
                    <p 
                      style={{
                        fontFamily: type.fontFamily || 'inherit',
                        fontSize: type.fontSize || 'inherit',
                        fontWeight: type.fontWeight || 'inherit',
                        lineHeight: type.lineHeight || 'inherit'
                      }}
                      className="break-words"
                    >
                      {type.name} - The quick brown fox jumps over the lazy dog
                    </p>
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1 space-y-1 text-sm">
                    <div className="grid grid-cols-2 gap-x-2">
                      <span className="text-gray-500">Name:</span>
                      <span className="font-mono">{type.name}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2">
                      <span className="text-gray-500">Font Family:</span>
                      <span className="font-mono">{type.fontFamily}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2">
                      <span className="text-gray-500">Font Size:</span>
                      <span className="font-mono">{type.fontSize}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2">
                      <span className="text-gray-500">Font Weight:</span>
                      <span className="font-mono">{type.fontWeight}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2">
                      <span className="text-gray-500">Line Height:</span>
                      <span className="font-mono">{type.lineHeight}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2">
                      <span className="text-gray-500">EDS Variable:</span>
                      <span className="font-mono text-xs truncate" title={type.edsVariable}>
                        {type.edsVariable}
                      </span>
                    </div>
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