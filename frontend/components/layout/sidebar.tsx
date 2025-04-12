'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useWorkflow } from '@/contexts/workflow-context';
import { WorkflowStep } from '@/lib/types';
import { 
  Upload, 
  Search, 
  Box, 
  Link2, 
  Code2, 
  CheckSquare,
  CheckCircle,
  Circle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Sidebar() {
  const pathname = usePathname();
  const { currentStep, completedSteps, canProceed } = useWorkflow();
  
  const steps: { id: WorkflowStep; name: string; path: string; icon: any }[] = [
    { 
      id: 'import', 
      name: 'Figma Import', 
      path: '/import',
      icon: Upload
    },
    { 
      id: 'analysis', 
      name: 'Design Analysis', 
      path: '/analysis',
      icon: Search
    },
    { 
      id: 'eds-import', 
      name: 'EDS Import', 
      path: '/eds-import',
      icon: Box
    },
    { 
      id: 'mapping', 
      name: 'Component Mapping', 
      path: '/mapping',
      icon: Link2
    },
    { 
      id: 'generation', 
      name: 'Code Generation', 
      path: '/generation',
      icon: Code2
    },
    { 
      id: 'validation', 
      name: 'Code Validation', 
      path: '/validation',
      icon: CheckSquare
    }
  ];
  
  return (
    <div className="hidden md:block pb-12 border-r">
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
            Workflow
          </h2>
          <div className="space-y-1">
            {steps.map((step, index) => {
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = currentStep === step.id;
              const isDisabled = !isCompleted && !isCurrent && !canProceed(step.id);
              
              return (
                <Link 
                  key={step.id}
                  href={isDisabled ? '#' : step.path}
                  className={cn(
                    "flex items-center justify-between py-2 px-3 text-sm font-medium rounded-md",
                    pathname === step.path && "bg-accent text-accent-foreground",
                    isDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-accent hover:text-accent-foreground",
                  )}
                  aria-disabled={isDisabled}
                  onClick={(e) => {
                    if (isDisabled) e.preventDefault();
                  }}
                >
                  <div className="flex items-center">
                    <step.icon className="mr-2 h-4 w-4" />
                    <span>{step.name}</span>
                  </div>
                  <div>
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : isCurrent ? (
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
