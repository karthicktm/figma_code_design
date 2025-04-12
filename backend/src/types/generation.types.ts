import { ComponentMapping } from './mapping.types';

export interface GenerationOptions {
  framework: 'react' | 'vue' | 'angular' | 'html';
  typescript: boolean;
  styling: 'css' | 'tailwind' | 'styled-components' | 'css-modules' | 'scss';
  generateLayout: boolean;
  includeDocumentation?: boolean;
  generateStories?: boolean;
}

export interface GeneratedComponent {
  name: string;
  type: string;
  files: Record<string, string>;
  metadata: {
    figmaId: string;
    edsId: string;
    confidence: number;
  };
}

export interface GeneratedLayout {
  name: string;
  files: Record<string, string>;
  metadata: {
    componentCount: number;
    timestamp: number;
  };
}

export interface CodeGenerationResult {
  components: GeneratedComponent[];
  layout?: GeneratedLayout;
  options: GenerationOptions;
  metadata: {
    timestamp: number;
    componentCount: number;
    framework: string;
    typescript:
