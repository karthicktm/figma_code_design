 'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertTriangle, XCircle, Download, RefreshCw, Loader2 } from 'lucide-react';
import { useWorkflow } from '@/contexts/workflow-context';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

interface ValidationIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  file: string;
  line?: number;
  column?: number;
  code?: string;
  solution?: string;
}

interface ValidationResult {
  syntaxScore: number;
  styleScore: number;
  responsivenessScore: number;
  overallScore: number;
  issues: ValidationIssue[];
}

export default function CodeValidation() {
  const { generatedCode } = useWorkflow(); // This would come from the context
  const { completeStep } = useWorkflow();
  const router = useRouter();
  const { toast } = useToast();
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  
  useEffect(() => {
    if (!generatedCode || Object.keys(generatedCode).length === 0) {
      router.push('/generation');
    } else {
      // Auto-validate on first load
      handleValidate();
    }
  }, [generatedCode, router]);
  
  const handleValidate = async () => {
    if (!generatedCode || Object.keys(generatedCode).length === 0) {
      toast({
        title: "No code to validate",
        description: "Please generate code before validation.",
        variant: "destructive",
      });
      return;
    }
    
    setIsValidating(true);
    
    try {
      // This would be replaced with an actual API call to validate code
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Sample validation result for demonstration
      const result: ValidationResult = {
        syntaxScore: 92,
        styleScore: 85,
        responsivenessScore: 78,
        overallScore: 85,
        issues: [
          {
            id: '1',
            type: 'warning',
            message: 'Inconsistent spacing in component props',
            file: 'Button.tsx',
            line: 12,
            column: 3,
            code: 'const { variant=  "primary", size = "md" } = props;',
            solution: 'Fix spacing around the equals sign: variant = "primary"'
          },
          {
            id: '2',
            type: 'info',
            message: 'Consider adding aria-label for accessibility',
            file: 'Button.tsx',
            line: 24,
            solution: 'Add aria-label attribute to improve accessibility'
          },
          {
            id: '3',
            type: 'error',
            message: 'Missing key prop in mapped elements',
            file: 'Layout.tsx',
            line: 15,
            solution: 'Add a unique key prop to each element in the map function'
          }
        ]
      };
      
      setValidationResult(result);
      
      toast({
        title: "Validation completed",
        description: `Overall score: ${result.overallScore}%. ${result.issues.length} issues found.`,
      });
    } catch (error) {
      toast({
        title: "Validation failed",
        description: "Failed to validate the generated code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };
  
  const handleDownload = () => {
    // This would be replaced with actual download logic
    toast({
      title: "Download started",
      description: "Your code package is being prepared for download.",
    });
    
    // Simulate download preparation
    setTimeout(() => {
      // In a real implementation, this would create a zip file and trigger download
      const a = document.createElement('a');
      a.href = '#';
      a.download = 'figma-to-code-export.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      completeStep('validation');
      
      toast({
        title: "Download complete",
        description: "Your code has been downloaded successfully.",
      });
    }, 1500);
  };
  
  if (isValidating) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Code Validation</h1>
          <p className="text-muted-foreground">Validating your generated code for quality and standards.</p>
        </div>
        
        <Card className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-16 w-16 animate-spin text-primary mb-6" />
          <h2 className="text-xl font-semibold mb-2">Validating Code</h2>
          <p className="text-muted-foreground mb-6">
            Checking syntax, style guidelines, and responsiveness...
          </p>
          <Progress value={45} className="w-64" />
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Code Validation</h1>
        <p className="text-muted-foreground">Review validation results and download your code.</p>
      </div>
      
      {validationResult && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-center">Overall Score</CardTitle>
              </CardHeader>
              <CardContent className="text-center pb-2">
                <div className="text-4xl font-bold">
                  {validationResult.overallScore}%
                </div>
                <Badge 
                  variant={validationResult.overallScore >= 80 ? "default" : validationResult.overallScore >= 60 ? "secondary" : "destructive"}
                  className="mt-2"
                >
                  {validationResult.overallScore >= 80 ? "Good" : validationResult.overallScore >= 60 ? "Needs Improvement" : "Poor"}
                </Badge>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-center">Syntax</CardTitle>
              </CardHeader>
              <CardContent className="text-center pb-2">
                <div className="text-4xl font-bold">
                  {validationResult.syntaxScore}%
                </div>
                <Progress
                  value={validationResult.syntaxScore}
                  className="mt-2"
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-center">Style</CardTitle>
              </CardHeader>
              <CardContent className="text-center pb-2">
                <div className="text-4xl font-bold">
                  {validationResult.styleScore}%
                </div>
                <Progress
                  value={validationResult.styleScore}
                  className="mt-2"
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-center">Responsiveness</CardTitle>
              </CardHeader>
              <CardContent className="text-center pb-2">
                <div className="text-4xl font-bold">
                  {validationResult.responsivenessScore}%
                </div>
                <Progress
                  value={validationResult.responsivenessScore}
                  className="mt-2"
                />
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Validation Issues</CardTitle>
              <CardDescription>
                {validationResult.issues.length} issues found in the generated code.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All Issues</TabsTrigger>
                  <TabsTrigger value="errors">
                    Errors <Badge variant="destructive" className="ml-1">{validationResult.issues.filter(i => i.type === 'error').length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="warnings">
                    Warnings <Badge variant="secondary" className="ml-1">{validationResult.issues.filter(i => i.type === 'warning').length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="info">
                    Info <Badge variant="outline" className="ml-1">{validationResult.issues.filter(i => i.type === 'info').length}</Badge>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="space-y-4">
                  {validationResult.issues.map((issue) => (
                    <Alert key={issue.id} variant={
                      issue.type === 'error' ? 'destructive' : 
                      issue.type === 'warning' ? 'default' : 'default'
                    }>
                      <div className="flex items-start">
                        <div className="mr-2 mt-0.5">
                          {issue.type === 'error' ? (
                            <XCircle className="h-5 w-5" />
                          ) : issue.type === 'warning' ? (
                            <AlertTriangle className="h-5 w-5" />
                          ) : (
                            <CheckCircle className="h-5 w-5" />
                          )}
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
                              {issue.solution && (
                                <div className="text-sm font-medium">
                                  Solution: {issue.solution}
                                </div>
                              )}
                            </div>
                          </AlertDescription>
                        </div>
                      </div>
                    </Alert>
                  ))}
                </TabsContent>
                
                <TabsContent value="errors" className="space-y-4">
                  {validationResult.issues.filter(i => i.type === 'error').map((issue) => (
                    <Alert key={issue.id} variant="destructive">
                      <div className="flex items-start">
                        <XCircle className="h-5 w-5 mr-2 mt-0.5" />
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
                              {issue.solution && (
                                <div className="text-sm font-medium">
                                  Solution: {issue.solution}
                                </div>
                              )}
                            </div>
                          </AlertDescription>
                        </div>
                      </div>
                    </Alert>
                  ))}
                </TabsContent>
                
                <TabsContent value="warnings" className="space-y-4">
                  {validationResult.issues.filter(i => i.type === 'warning').map((issue) => (
                    <Alert key={issue.id}>
                      <div className="flex items-start">
                        <AlertTriangle className="h-5 w-5 mr-2 mt-0.5" />
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
                              {issue.solution && (
                                <div className="text-sm font-medium">
                                  Solution: {issue.solution}
                                </div>
                              )}
                            </div>
                          </AlertDescription>
                        </div>
                      </div>
                    </Alert>
                  ))}
                </TabsContent>
                
                <TabsContent value="info" className="space-y-4">
                  {validationResult.issues.filter(i => i.type === 'info').map((issue) => (
                    <Alert key={issue.id} variant="default">
                      <div className="flex items-start">
                        <CheckCircle className="h-5 w-5 mr-2 mt-0.5" />
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
                              {issue.solution && (
                                <div className="text-sm font-medium">
                                  Solution: {issue.solution}
                                </div>
                              )}
                            </div>
                          </AlertDescription>
                        </div>
                      </div>
                    </Alert>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={handleValidate}
                disabled={isValidating}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Revalidate
              </Button>
              
              <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
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
                  <Badge variant={validationResult.overallScore >= 80 ? "default" : "secondary"}>
                    {validationResult.overallScore >= 90 ? "Excellent" : 
                     validationResult.overallScore >= 80 ? "Good" : 
                     validationResult.overallScore >= 70 ? "Satisfactory" : 
                     "Needs Improvement"}
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
                    validationResult.issues.filter(i => i.type === 'error').length === 0 ? "default" : "destructive"
                  }>
                    {validationResult.issues.filter(i => i.type === 'error').length} Issues
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
                  {validationResult.issues.filter(i => i.type === 'error').length === 0 ? (
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
        </>
      )}
    </div>
  );
}