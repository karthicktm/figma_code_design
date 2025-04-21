import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AgentStatus } from '@/store';

export function ComponentRecognitionModule() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Component Recognition Module</CardTitle>
      </CardHeader>
      <CardContent>
        <p>This module will identify UI components in the design.</p>
        <p>Implementation coming soon...</p>
      </CardContent>
    </Card>
  );
}
