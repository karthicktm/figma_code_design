// src/modules/component-recognition/component-viewer.tsx
import React, { useState } from 'react';
import { RecognizedComponent } from '@/types/agent-interfaces';

interface ComponentViewerProps {
  components: RecognizedComponent[];
}

export function ComponentViewer({ components }: ComponentViewerProps) {
  // Group components by type for better organization
  const groupedComponents = components.reduce((acc, component) => {
    const type = component.edsComponentType || 'Other';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(component);
    return acc;
  }, {} as Record<string, RecognizedComponent[]>);
  
  // Count components by type
  const componentCounts = Object.entries(groupedComponents).map(([type, comps]) => ({
    type,
    count: comps.length
  }));
  
  // Get unique component types
  const componentTypes = Object.keys(groupedComponents);
  
  const [selectedType, setSelectedType] = useState(componentTypes[0] || '');
  const [selectedComponent, setSelectedComponent] = useState<RecognizedComponent | null>(
    groupedComponents[selectedType]?.[0] || null
  );
  
  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    setSelectedComponent(groupedComponents[type]?.[0] || null);
  };
  
  const handleComponentSelect = (component: RecognizedComponent) => {
    setSelectedComponent(component);
  };
  
  if (components.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-500">No components detected</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Component Type Selector */}
      <div className="md:col-span-1 border rounded-md p-4">
        <h3 className="font-medium mb-3">Component Types</h3>
        <div className="space-y-2">
          {componentCounts.map(({ type, count }) => (
            <button
              key={type}
              className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                selectedType === type 
                  ? 'bg-primary text-white' 
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => handleTypeChange(type)}
            >
              {type} <span className="text-xs ml-1 opacity-70">({count})</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Components List */}
      <div className="md:col-span-1 border rounded-md p-4 h-80 overflow-y-auto">
        <h3 className="font-medium mb-3">Components</h3>
        {selectedType && groupedComponents[selectedType] && (
          <div className="space-y-2">
            {groupedComponents[selectedType].map((component, index) => (
              <button
                key={index}
                className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                  selectedComponent === component 
                    ? 'bg-primary text-white' 
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => handleComponentSelect(component)}
              >
                {component.name}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Component Preview */}
      <div className="md:col-span-2 border rounded-md p-4">
        <h3 className="font-medium mb-3">Component Preview</h3>
        
        {selectedComponent ? (
          <div className="space-y-4">
            <div className="bg-gray-100 p-4 rounded-md">
              {/* Render a preview based on component type */}
              {renderComponentPreview(selectedComponent)}
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Properties</h4>
              <div className="bg-gray-50 p-3 rounded text-sm font-mono overflow-x-auto">
                <pre>{JSON.stringify(selectedComponent.properties, null, 2)}</pre>
              </div>
            </div>
            
            {selectedComponent.layout && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Layout</h4>
                <div className="bg-gray-50 p-3 rounded text-sm font-mono overflow-x-auto">
                  <pre>{JSON.stringify(selectedComponent.layout, null, 2)}</pre>
                </div>
              </div>
            )}
            
            {selectedComponent.styles && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Styles</h4>
                <div className="bg-gray-50 p-3 rounded text-sm font-mono overflow-x-auto">
                  <pre>{JSON.stringify(selectedComponent.styles, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500">Select a component to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to render a preview based on component type
function renderComponentPreview(component: RecognizedComponent): React.ReactNode {
  switch (component.edsComponentType) {
    case 'Button':
      return (
        <div className="flex justify-center p-4">
          <button
            className={`
              px-4 py-2 rounded-md text-sm font-bold cursor-pointer inline-flex items-center justify-center gap-2
              ${component.properties.variant === 'primary' 
                ? 'bg-blue-600 text-white border-none' 
                : component.properties.variant === 'secondary'
                ? 'bg-white text-blue-600 border border-blue-600'
                : component.properties.variant === 'destructive'
                ? 'bg-red-600 text-white border-none'
                : 'bg-gray-100 text-gray-800 border border-gray-300'
              }
            `}
          >
            {component.properties.hasIcon && (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 4V12M4 8H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            {component.properties.text || component.name}
          </button>
        </div>
      );
      
    case 'Input':
      const inputStyle: React.CSSProperties = {
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '14px',
        border: '1px solid #ddd',
        width: '100%'
      };
      
      return (
        <div className="p-4 space-y-2">
          {component.properties.label && (
            <label className="block text-sm font-medium mb-1">{component.properties.label}</label>
          )}
          <input 
            type={component.properties.type || 'text'} 
            placeholder={component.properties.placeholder || 'Enter text...'}
            style={inputStyle}
          />
        </div>
      );
      
    case 'Card':
      const cardStyle: React.CSSProperties = {
        borderRadius: component.properties.cornerRadius ? `${component.properties.cornerRadius}px` : '8px',
        border: component.properties.hasBorder ? '1px solid #ddd' : 'none',
        boxShadow: component.properties.hasShadow ? '0 4px 6px rgba(0, 0, 0, 0.1)' : 'none',
        overflow: 'hidden',
        width: '100%'
      };
      
      return (
        <div style={cardStyle}>
          {component.properties.hasHeader && (
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-medium">Card Header</h3>
            </div>
          )}
          {component.properties.hasContent && (
            <div className="p-4">
              <p className="text-sm text-gray-600">Card content goes here...</p>
            </div>
          )}
        </div>
      );
      
    case 'Checkbox':
      return (
        <div className="p-4 flex items-center">
          <input type="checkbox" id="checkbox-preview" className="mr-2" />
          <label htmlFor="checkbox-preview" className="text-sm">Checkbox Label</label>
        </div>
      );
      
    case 'Radio':
      return (
        <div className="p-4 space-y-2">
          <div className="flex items-center">
            <input type="radio" id="radio1-preview" name="radio-group" className="mr-2" checked />
            <label htmlFor="radio1-preview" className="text-sm">Option 1</label>
          </div>
          <div className="flex items-center">
            <input type="radio" id="radio2-preview" name="radio-group" className="mr-2" />
            <label htmlFor="radio2-preview" className="text-sm">Option 2</label>
          </div>
        </div>
      );
      
    case 'Select':
      return (
        <div className="p-4">
          <select className="w-full p-2 border border-gray-300 rounded-md">
            <option>Option 1</option>
            <option>Option 2</option>
            <option>Option 3</option>
          </select>
        </div>
      );
      
    case 'Icon':
      // For icons, show a simple placeholder
      return (
        <div className="p-4 flex justify-center">
          <div className="w-8 h-8 bg-gray-200 flex items-center justify-center rounded-md">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 4V12M4 8H12" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      );
      
    case 'Table':
      return (
        <div className="p-4 overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-300 px-4 py-2 bg-gray-50">Header 1</th>
                <th className="border border-gray-300 px-4 py-2 bg-gray-50">Header 2</th>
                <th className="border border-gray-300 px-4 py-2 bg-gray-50">Header 3</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-2">Cell 1</td>
                <td className="border border-gray-300 px-4 py-2">Cell 2</td>
                <td className="border border-gray-300 px-4 py-2">Cell 3</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">Cell 4</td>
                <td className="border border-gray-300 px-4 py-2">Cell 5</td>
                <td className="border border-gray-300 px-4 py-2">Cell 6</td>
              </tr>
            </tbody>
          </table>
        </div>
      );
      
    case 'Dialog':
      return (
        <div className="relative">
          <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200 w-full max-w-md mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Dialog Title</h3>
              <button className="text-gray-500 hover:text-gray-700">×</button>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600">Dialog content goes here...</p>
            </div>
            <div className="flex justify-end space-x-2">
              <button className="px-4 py-2 text-sm border rounded">Cancel</button>
              <button className="px-4 py-2 text-sm bg-blue-500 text-white rounded">Confirm</button>
            </div>
          </div>
        </div>
      );
      
    case 'Tabs':
      return (
        <div className="p-4">
          <div className="border-b">
            <div className="flex">
              <button className="px-4 py-2 text-sm border-b-2 border-blue-500 font-medium">Tab 1</button>
              <button className="px-4 py-2 text-sm text-gray-500">Tab 2</button>
              <button className="px-4 py-2 text-sm text-gray-500">Tab 3</button>
            </div>
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-600">Tab content goes here...</p>
          </div>
        </div>
      );
      
    case 'Navigation':
      return (
        <div className="p-4">
          <nav className="flex space-x-4">
            <a href="#" className="text-blue-500 font-medium">Home</a>
            <a href="#" className="text-gray-500">About</a>
            <a href="#" className="text-gray-500">Services</a>
            <a href="#" className="text-gray-500">Contact</a>
          </nav>
        </div>
      );
      
    case 'Label':
      return (
        <div className="p-4">
          <p 
            className={`
              ${component.styles?.typography?.fontFamily ? `font-${component.styles.typography.fontFamily}` : ''}
              ${component.styles?.typography?.fontSize ? `text-[${component.styles.typography.fontSize}]` : ''}
              ${component.styles?.typography?.fontWeight ? `font-${component.styles.typography.fontWeight}` : ''}
              ${component.styles?.typography?.lineHeight ? `leading-[${component.styles.typography.lineHeight}]` : ''}
              ${component.styles?.typography?.textAlign ? `text-${component.styles.typography.textAlign}` : ''}
            `}
          >
            {component.properties.text || 'Sample Text'}
          </p>
        </div>
      );
      
    case 'Container':
      return (
        <div 
          className={`
            p-4 border border-dashed border-gray-300 rounded-md min-h-[100px] flex items-center justify-center
            ${component.layout?.flexDirection === 'row' ? 'flex-row' : 'flex-col'}
          `}
        >
          <p className="text-sm text-gray-500">Container: {component.name}</p>
        </div>
      );
      
    default:
      return (
        <div className="p-4 text-center text-gray-500">
          <p>Preview not available for {component.edsComponentType || 'this component type'}</p>
        </div>
      );
  }
}