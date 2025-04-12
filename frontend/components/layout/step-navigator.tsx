// components/layout/step-navigator.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';
import { useWorkflow } from '@/contexts/workflow-context';
import { WorkflowStep } from '@/lib/types';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function StepNavigator() {
  const { currentStep, completedSteps, canProceed } = useWorkflow();
  
  const steps: { id: WorkflowStep; name: string; path: string }[] = [
    { id: 'import', name: 'Figma Import', path: '/import' },
    { id: 'analysis', name: 'Design Analysis', path: '/analysis' },
    { id: 'eds-import', name: 'EDS Import', path: '/eds-import' },
    { id: 'mapping', name: 'Component Mapping', path: '/mapping' },
    { id: 'generation', name: 'Code Generation', path: '/generation' },
    { id: 'validation', name: 'Code Validation', path: '/validation' }
  ];
  
  return (
    <Card className="p-4">
      <div className="space-y-4">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          const isDisabled = !isCompleted && !isCurrent && !canProceed(step.id);
          
          return (
            <div key={step.id} className="flex items-center gap-3">
              <div className={cn(
                "rounded-full p-1",
                isCompleted ? "text-green-500" : 
                isCurrent ? "text-blue-500" : 
                "text-gray-300"
              )}>
                {isCompleted ? <CheckCircle size={20} /> : <Circle size={20} />}
              </div>
              <Link href={isDisabled ? '#' : step.path} className="flex-1">
                <Button 
                  variant={isCurrent ? "default" : "ghost"} 
                  className="w-full justify-start" 
                  disabled={isDisabled}
                >
                  {step.name}
                </Button>
              </Link>
              {isCurrent && (
                <div className="text-blue-500">
                  <ArrowRight size={16} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}