 // components/validation/code-issue-list.tsx
'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ValidationIssue } from '@/lib/types';
import { XCircle, AlertTriangle, CheckCircle } from 'lucide-react';

interface CodeIssueListProps {
  issues: ValidationIssue[];
}

export function CodeIssueList({ issues }: CodeIssueListProps) {
  const [activeTab, setActiveTab] = useState<string>('all');
  
  // Count issues by severity
  const errorCount = issues.filter(issue => issue.severity === 'error').length;
  const warningCount = issues.filter(issue => issue.severity === 'warning').length;
  const infoCount = issues.filter(issue => issue.severity === 'info').length;
  
  if (issues.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-green-600 font-medium">No issues found. Your code looks great!</p>
      </div>
    );
  }
  
  return (
    <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-4">
        <TabsTrigger value="all">
          All Issues <Badge className="ml-1">{issues.length}</Badge>
        </TabsTrigger>
        <TabsTrigger value="errors">
          Errors <Badge variant="destructive" className="ml-1">{errorCount}</Badge>
        </TabsTrigger>
        <TabsTrigger value="warnings">
          Warnings <Badge variant="secondary" className="ml-1">{warningCount}</Badge>
        </TabsTrigger>
        <TabsTrigger value="info">
          Info <Badge variant="outline" className="ml-1">{infoCount}</Badge>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="all" className="space-y-4">
        {issues.map((issue) => (
          <IssueAlert key={issue.id} issue={issue} />
        ))}
      </TabsContent>
      
      <TabsContent value="errors" className="space-y-4">
        {issues.filter(i => i.severity === 'error').map((issue) => (
          <IssueAlert key={issue.id} issue={issue} />
        ))}
      </TabsContent>
      
      <TabsContent value="warnings" className="space-y-4">
        {issues.filter(i => i.severity === 'warning').map((issue) => (
          <IssueAlert key={issue.id} issue={issue} />
        ))}
      </TabsContent>
      
      <TabsContent value="info" className="space-y-4">
        {issues.filter(i => i.severity === 'info').map((issue) => (
          <IssueAlert key={issue.id} issue={issue} />
        ))}
      </TabsContent>
    </Tabs>
  );
}

interface IssueAlertProps {
  issue: ValidationIssue;
}

function IssueAlert({ issue }: IssueAlertProps) {
  const alertVariant = 
    issue.severity === 'error' ? 'destructive' : 
    issue.severity === 'warning' ? 'default' : 'default';
  
  const Icon = 
    issue.severity === 'error' ? XCircle : 
    issue.severity === 'warning' ? AlertTriangle : CheckCircle;
  
  return (
    <Alert variant={alertVariant}>
      <div className="flex items-start">
        <div className="mr-2 mt-0.5">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <AlertTitle className="flex items-center justify-between mb-1">
            <span>{issue.message}</span>
            <Badge variant="outline" className="ml-2">
              {issue.file}{issue.line ? `:${issue.line}` : ''}
            </Badge>
          </AlertTitle>
          <AlertDescription>
            <div className="space-y-2">
              {issue.code && (
                <pre className="p-2 rounded-md bg-muted text-xs overflow-x-auto">
                  <code>{issue.code}</code>
                </pre>
              )}
              {issue.suggestion && (
                <div className="text-sm font-medium">
                  Solution: {issue.suggestion}
                </div>
              )}
            </div>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
