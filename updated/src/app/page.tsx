// src/app/page.tsx
'use client';

import React from 'react';
import { ModuleNavigation } from '@/components/module-navigation';
import { ModuleContainer } from '@/components/module-container';

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <div className="flex flex-col space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Figma to EDS Angular Converter</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Convert your Figma designs to Angular components using the Ericsson Design System (EDS)
          </p>
        </div>
        
        <div className="mb-8">
          <ModuleNavigation />
        </div>
        
        <ModuleContainer />
      </div>
    </main>
  );
}
