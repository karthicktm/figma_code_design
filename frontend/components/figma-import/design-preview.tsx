 // components/figma-import/design-preview.tsx
'use client';

import { useState } from 'react';
import { useFigma } from '@/contexts/figma-context';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function DesignPreview() {
  const { figmaData, figmaComponents } = useFigma();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  
  if (!figmaData || !figmaComponents) {
    return <div className="text-center py-6">No design data available to preview.</div>;
  }
  
  // Filter components based on search term
  const filteredComponents = searchTerm
    ? figmaComponents.filter(comp => 
        comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comp.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comp.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : figmaComponents;
  
  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };
  
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search components..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="text-sm text-muted-foreground mb-2">
        Showing {filteredComponents.length} of {figmaComponents.length} components
      </div>
      
      <div className="rounded-md border">
        <div className="bg-muted p-2 flex">
          <div className="w-1/2 font-medium">Name</div>
          <div className="w-1/4 font-medium">Type</div>
          <div className="w-1/4 font-medium">ID</div>
        </div>
        
        <div className="divide-y">
          {filteredComponents.length > 0 ? (
            filteredComponents.map(component => (
              <div 
                key={component.id} 
                className="hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => toggleNode(component.id)}
              >
                <div className="p-2 flex">
                  <div className="w-1/2 font-medium">{component.name}</div>
                  <div className="w-1/4">
                    <Badge variant="outline">{component.type}</Badge>
                  </div>
                  <div className="w-1/4 text-xs text-muted-foreground truncate">
                    {component.id}
                  </div>
                </div>
                
                {expandedNodes.has(component.id) && (
                  <div className="p-2 bg-muted/30 border-t">
                    <div className="text-xs space-y-1">
                      <div><span className="font-medium">Full ID:</span> {component.id}</div>
                      {component.properties && (
                        <div>
                          <span className="font-medium">Properties:</span>
                          <pre className="mt-1 p-1 bg-muted/50 rounded text-xs overflow-auto">
                            {JSON.stringify(component.properties, null, 2)}
                          </pre>
                        </div>
                      )}
                      {component.children && component.children.length > 0 && (
                        <div>
                          <span className="font-medium">Children:</span> {component.children.length} nodes
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              No components found matching your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
