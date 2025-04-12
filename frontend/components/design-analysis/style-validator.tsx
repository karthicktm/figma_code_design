 // components/design-analysis/style-validator.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { StyleIssue } from '@/lib/types';

interface StyleValidatorProps {
  styleIssues: StyleIssue[];
}

export function StyleValidator({ styleIssues }: StyleValidatorProps) {
  if (!styleIssues || styleIssues.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Style Validation</CardTitle>
          <CardDescription>No style issues detected. Your design is consistent!</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Style Validation</CardTitle>
        <CardDescription>
          Consistency checks for colors, typography, and spacing in your design.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {styleIssues.map((issue, index) => (
            <Alert key={index}>
              <AlertDescription>
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium capitalize">{issue.type.replace(/-/g, ' ')}</h4>
                    <p className="text-sm">{issue.message}</p>
                    {issue.affectedItems && issue.affectedItems.length > 0 && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Affected: {issue.affectedItems.slice(0, 3).join(', ')}
                        {issue.affectedItems.length > 3 && ` and ${issue.affectedItems.length - 3} more`}
                      </div>
                    )}
                  </div>
                  <Button variant="outline" size="sm">View Details</Button>
                </div>
                {issue.suggestion && (
                  <div className="mt-2 text-sm border-l-2 pl-2 border-muted-foreground/20">
                    <span className="font-medium">Suggestion:</span> {issue.suggestion}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          ))}
          
          {styleIssues.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              No style issues detected.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

