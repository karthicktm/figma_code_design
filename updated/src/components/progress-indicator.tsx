// src/components/progress-indicator.tsx
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { AgentStatus } from '@/store';

interface ProgressIndicatorProps {
  status: AgentStatus;
  progress: number;
  error: string | null;
}

export function ProgressIndicator({ status, progress, error }: ProgressIndicatorProps) {
  return (
    <div className="mt-4">
      {status === AgentStatus.Running && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Processing...</span>
            <span className="text-sm font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      )}
      
      {status === AgentStatus.Complete && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3 flex items-center text-green-800">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Process completed successfully!</span>
        </div>
      )}
      
      {status === AgentStatus.Error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center text-red-800">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-medium">An error occurred</p>
            {error && <p className="text-sm">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
