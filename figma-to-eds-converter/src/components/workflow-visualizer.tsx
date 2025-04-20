import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkflowStep } from '@/lib/workflow-engine';

interface WorkflowVisualizerProps {
  steps: WorkflowStep[];
}

export function WorkflowVisualizer({ steps }: WorkflowVisualizerProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Workflow Progress</h2>
      
      <div className="grid md:grid-cols-2 gap-4">
        {steps.map((step) => (
          <WorkflowStepCard key={step.id} step={step} />
        ))}
      </div>
    </div>
  );
}

interface WorkflowStepCardProps {
  step: WorkflowStep;
}

function WorkflowStepCard({ step }: WorkflowStepCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'running':
        return 'bg-blue-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'running':
        return 'Running...';
      case 'failed':
        return 'Failed';
      default:
        return 'Pending';
    }
  };
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="py-3">
        <CardTitle className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${getStatusColor(step.status)}`}></div>
          <span>{step.name}</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-gray-500 mb-4">{step.description}</p>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Status:</span>
            <span className="font-medium">{getStatusText(step.status)}</span>
          </div>
          
          {step.progress !== undefined && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${step.progress}%` }}
              ></div>
            </div>
          )}
          
          {step.error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {step.error}
            </div>
          )}
          
          {step.dependencies.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-1">Dependencies:</p>
              <div className="flex flex-wrap gap-1">
                {step.dependencies.map(depId => (
                  <span 
                    key={depId} 
                    className="px-2 py-1 bg-gray-100 text-xs rounded-full"
                  >
                    {depId}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}