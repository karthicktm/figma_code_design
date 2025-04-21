import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AgentStatus } from '@/store';

export function StyleExtractionModule() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Style Extraction Module</CardTitle>
      </CardHeader>
      <CardContent>
        <p>This module will extract design tokens and styles.</p>
        <p>Implementation coming soon...</p>
      </CardContent>
    </Card>
  );
}
