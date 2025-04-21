// src/components/module-container.tsx
import React from 'react';
import { useAppStore } from '@/store';

// Import module components
import { DesignInputModule } from '@/modules/design-input';
import { AssetManagerModule } from '@/modules/asset-manager';
import { ComponentRecognitionModule } from '@/modules/component-recognition';
import { StyleExtractionModule } from '@/modules/style-extraction';
import { CodeGenerationModule } from '@/modules/code-generation';
import { OutputPreviewModule } from '@/modules/output-preview';

export function ModuleContainer() {
  const { activeModule } = useAppStore();
  
  return (
    <div className="container mx-auto">
      {activeModule === 'design-input' && <DesignInputModule />}
      {activeModule === 'asset-manager' && <AssetManagerModule />}
      {activeModule === 'component-recognition' && <ComponentRecognitionModule />}
      {activeModule === 'style-extraction' && <StyleExtractionModule />}
      {activeModule === 'code-generation' && <CodeGenerationModule />}
      {activeModule === 'output-preview' && <OutputPreviewModule />}
    </div>
  );
}