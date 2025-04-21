// src/components/progress-indicator.tsx
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { AgentStatus } from '@/store';

interface ProgressIndicatorProps {
  status: AgentStatus;
  progress: number;
  error: string | null;
  isProcessing?: boolean;
}

export function ProgressIndicator({ status, progress, error, isProcessing }: ProgressIndicatorProps) {
  const isRunning = status === AgentStatus.Running || isProcessing;
  
  return (
    <div className="space-y-2">
      <Progress value={progress} className="w-full" />
      <div className="text-sm text-gray-600">
        {isRunning ? `Processing... ${progress}%` : 
         status === AgentStatus.Complete ? 'Complete' :
         status === AgentStatus.Error ? 'Error' : 'Ready'}
      </div>
    </div>
  );
}
