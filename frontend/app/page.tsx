import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Figma-to-Code</h1>
          <p className="text-muted-foreground">Convert your Figma designs into production-ready code.</p>
        </div>
        <Link href="/import">
          <Button size="lg">
            Start New Project
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>Get started with a new project</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Import your Figma design and convert it to code in minutes.</p>
          </CardContent>
          <CardFooter>
            <Link href="/import" className="w-full">
              <Button className="w-full">Start New Project</Button>
            </Link>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Documentation</CardTitle>
            <CardDescription>Learn how to use the system</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Read the documentation to learn about all features and best practices.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">View Documentation</Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Advanced Features</CardTitle>
            <CardDescription>Customize templates and more</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Access advanced features like custom templates and batch processing.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">Explore Features</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
