// components/code-generation/options-panel.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { GenerationOptions } from '@/lib/types';

interface OptionsPanelProps {
  options: GenerationOptions;
  onChange: (options: GenerationOptions) => void;
  frameworkSpecificOptions?: React.ReactNode;
}

export function OptionsPanel({ 
  options, 
  onChange,
  frameworkSpecificOptions
}: OptionsPanelProps) {
  // Helper function to update a specific option
  const updateOption = <K extends keyof GenerationOptions>(key: K, value: GenerationOptions[K]) => {
    onChange({
      ...options,
      [key]: value
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Advanced Options</CardTitle>
        <CardDescription>
          Configure additional code generation options.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Standard options available for all frameworks */}
          <div className="space-y-4">
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="layout" className="flex flex-col space-y-1">
                <span>Generate Layout Code</span>
                <span className="font-normal text-xs text-muted-foreground">
                  Create a layout that combines all components
                </span>
              </Label>
              <Switch
                id="layout"
                checked={options.generateLayout}
                onCheckedChange={(checked) => updateOption('generateLayout', checked)}
              />
            </div>
            
            {options.framework === 'react' || options.framework === 'vue' ? (
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="typescript" className="flex flex-col space-y-1">
                  <span>Use TypeScript</span>
                  <span className="font-normal text-xs text-muted-foreground">
                    Generate strongly-typed code
                  </span>
                </Label>
                <Switch
                  id="typescript"
                  checked={options.typescript}
                  onCheckedChange={(checked) => updateOption('typescript', checked)}
                />
              </div>
            ) : null}
            
            {/* Styling options */}
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="documentation" className="flex flex-col space-y-1">
                <span>Include Documentation</span>
                <span className="font-normal text-xs text-muted-foreground">
                  Add comments explaining the code
                </span>
              </Label>
              <Switch
                id="documentation"
                checked={options.includeDocumentation || false}
                onCheckedChange={(checked) => 
                  updateOption('includeDocumentation' as keyof GenerationOptions, checked as any)
                }
              />
            </div>
            
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="storybook" className="flex flex-col space-y-1">
                <span>Generate Storybook Stories</span>
                <span className="font-normal text-xs text-muted-foreground">
                  Create Storybook story files for each component
                </span>
              </Label>
              <Switch
                id="storybook"
                checked={options.generateStories || false}
                onCheckedChange={(checked) => 
                  updateOption('generateStories' as keyof GenerationOptions, checked as any)
                }
              />
            </div>
          </div>
          
          {/* Framework-specific options passed as children */}
          {frameworkSpecificOptions && (
            <>
              <div className="h-px bg-border my-4" />
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Framework-Specific Options</h3>
                {frameworkSpecificOptions}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 
