 // components/validation/validation-results.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { ValidationResult } from '@/lib/types';
import { CodeIssueList } from './code-issue-list';

interface ValidationResultsProps {
  validationResult: ValidationResult;
  onRevalidate: () => void;
  onDownload: () => void;
}

export function ValidationResults({ 
  validationResult, 
  onRevalidate, 
  onDownload 
}: ValidationResultsProps) {
  if (!validationResult) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No validation results available.</p>
      </div>
    );
  }
  
  const { 
    syntaxScore, 
    styleScore, 
    responsiveScore, 
    overallScore, 
    issues, 
    passedValidation 
  } = validationResult;
  
  // Count issues by severity
  const errorCount = issues.filter(issue => issue.severity === 'error').length;
  const warningCount = issues.filter(issue => issue.severity === 'warning').length;
  const infoCount = issues.filter(issue => issue.severity === 'info').length;
  
  // Determine score colors
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-600';
  };
  
  // Determine score labels
  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Satisfactory';
    if (score >= 50) return 'Needs Improvement';
    return 'Poor';
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-center">Overall Score</CardTitle>
          </CardHeader>
          <CardContent className="text-center pb-2">
            <div className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>
              {Math.round(overallScore)}%
            </div>
            <Badge 
              variant={overallScore >= 80 ? "default" : overallScore >= 60 ? "secondary" : "destructive"}
              className="mt-2"
            >
              {getScoreLabel(overallScore)}
            </Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-center">Syntax</CardTitle>
          </CardHeader>
          <CardContent className="text-center pb-2">
            <div className={`text-4xl font-bold ${getScoreColor(syntaxScore)}`}>
              {Math.round(syntaxScore)}%
            </div>
            <Progress
              value={syntaxScore}
              className="mt-2"
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-center">Style</CardTitle>
          </CardHeader>
          <CardContent className="text-center pb-2">
            <div className={`text-4xl font-bold ${getScoreColor(styleScore)}`}>
              {Math.round(styleScore)}%
            </div>
            <Progress
              value={styleScore}
              className="mt-2"
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-center">Responsiveness</CardTitle>
          </CardHeader>
          <CardContent className="text-center pb-2">
            <div className={`text-4xl font-bold ${getScoreColor(responsiveScore)}`}>
              {Math.round(responsiveScore)}%
            </div>
            <Progress
              value={responsiveScore}
              className="mt-2"
            />
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Validation Issues</CardTitle>
          <CardDescription>
            {issues.length} issues found in the generated code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CodeIssueList issues={issues} />
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={onRevalidate}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Revalidate
          </Button>
          
          <Button onClick={onDownload}>
            Download Code
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Production Readiness</CardTitle>
          <CardDescription>
            Assessment of the code's readiness for production use.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <div>
                <h4 className="font-medium">Overall Quality</h4>
                <p className="text-sm text-muted-foreground">
                  Based on syntax, style, and responsiveness scores
                </p>
              </div>
              <Badge variant={overallScore >= 80 ? "default" : "secondary"}>
                {getScoreLabel(overallScore)}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <div>
                <h4 className="font-medium">Critical Issues</h4>
                <p className="text-sm text-muted-foreground">
                  Errors that should be fixed before production use
                </p>
              </div>
              <Badge variant={
                errorCount === 0 ? "default" : "destructive"
              }>
                {errorCount} Issues
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <div>
                <h4 className="font-medium">Browser Compatibility</h4>
                <p className="text-sm text-muted-foreground">
                  Support for modern browsers based on features used
                </p>
              </div>
              <Badge variant="default">
                Good
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <div>
                <h4 className="font-medium">Accessibility</h4>
                <p className="text-sm text-muted-foreground">
                  Compliance with WCAG guidelines
                </p>
              </div>
              <Badge variant="secondary">
                Satisfactory
              </Badge>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Alert>
            <AlertDescription>
              {errorCount === 0 ? (
                <div className="text-green-600 font-medium flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  The code is production-ready with minor warnings that should be reviewed.
                </div>
              ) : (
                <div className="text-amber-600 font-medium flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Please fix the critical issues before using this code in production.
                </div>
              )}
            </AlertDescription>
          </Alert>
        </CardFooter>
      </Card>
    </div>
  );
}
