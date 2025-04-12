 // components/code-generation/framework-selector.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { GenerationOptions } from '@/lib/types';

interface FrameworkSelectorProps {
  options: GenerationOptions;
  onChange: (options: GenerationOptions) => void;
}

export function FrameworkSelector({ options, onChange }: FrameworkSelectorProps) {
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
        <CardTitle>Framework Options</CardTitle>
        <CardDescription>
          Configure how your code will be generated.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="framework">Framework</Label>
              <Select
                value={options.framework}
                onValueChange={(value: string) => updateOption('framework', value as GenerationOptions['framework'])}
              >
                <SelectTrigger id="framework">
                  <SelectValue placeholder="Select a framework" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="react">React</SelectItem>
                  <SelectItem value="vue">Vue</SelectItem>
                  <SelectItem value="angular">Angular</SelectItem>
                  <SelectItem value="html">HTML/CSS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {(options.framework === 'react' || options.framework === 'vue') && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="typescript"
                  checked={options.typescript}
                  onCheckedChange={(checked: boolean | 'indeterminate') => 
                    updateOption('typescript', !!checked)
                  }
                />
                <Label htmlFor="typescript" className="cursor-pointer">Use TypeScript</Label>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="styling">Styling Approach</Label>
              <Select
                value={options.styling}
                onValueChange={(value: string) => updateOption('styling', value as GenerationOptions['styling'])}
              >
                <SelectTrigger id="styling">
                  <SelectValue placeholder="Select a styling approach" />
                </SelectTrigger>
                <SelectContent>
                  {options.framework === 'react' && (
                    <>
                      <SelectItem value="css">CSS</SelectItem>
                      <SelectItem value="tailwind">Tailwind CSS</SelectItem>
                      <SelectItem value="styled-components">Styled Components</SelectItem>
                      <SelectItem value="css-modules">CSS Modules</SelectItem>
                    </>
                  )}
                  {options.framework === 'vue' && (
                    <>
                      <SelectItem value="css">Scoped CSS</SelectItem>
                      <SelectItem value="tailwind">Tailwind CSS</SelectItem>
                      <SelectItem value="scss">SCSS</SelectItem>
                    </>
                  )}
                  {options.framework === 'angular' && (
                    <>
                      <SelectItem value="css">CSS</SelectItem>
                      <SelectItem value="scss">SCSS</SelectItem>
                    </>
                  )}
                  {options.framework === 'html' && (
                    <>
                      <SelectItem value="css">CSS</SelectItem>
                      <SelectItem value="tailwind">Tailwind CSS</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="layout"
                checked={options.generateLayout}
                onCheckedChange={(checked: boolean | 'indeterminate') => 
                  updateOption('generateLayout', !!checked)
                }
              />
              <Label htmlFor="layout" className="cursor-pointer">Generate layout code</Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
