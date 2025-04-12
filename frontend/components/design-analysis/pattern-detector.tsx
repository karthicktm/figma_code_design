 // components/design-analysis/pattern-detector.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ComponentPattern } from '@/lib/types';

interface PatternDetectorProps {
  patterns: Record<string, ComponentPattern>;
}

export function PatternDetector({ patterns }: PatternDetectorProps) {
  if (!patterns || Object.keys(patterns).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Component Patterns</CardTitle>
          <CardDescription>No patterns detected yet. Run the analysis first.</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Detected Component Patterns</CardTitle>
        <CardDescription>
          Components identified in your design based on their structure and properties.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(patterns).map(([patternType, pattern]) => (
            <div key={patternType} className="flex items-center justify-between p-2 bg-muted rounded-md">
              <div>
                <h4 className="font-medium capitalize">{patternType}</h4>
                <p className="text-sm text-muted-foreground">
                  {pattern.count} instances detected
                </p>
              </div>
              <div className="text-sm">
                <span className={
                  pattern.confidence >= 0.9 ? 'text-green-500' :
                  pattern.confidence >= 0.7 ? 'text-amber-500' :
                  'text-red-500'
                }>
                  {Math.round(pattern.confidence * 100)}% confidence
                </span>
              </div>
            </div>
          ))}
          
          {Object.keys(patterns).length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              No component patterns detected.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

