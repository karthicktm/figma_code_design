// src/context/DesignContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { FigmaDocument, ExtractedComponent } from '../services/figmaParser';

export interface Asset {
  id: string;
  type: 'font' | 'icon' | 'image';
  name: string;
  file: File | null;
  path: string;
}

export interface EdsConfig {
  version: string;
  path: string;
  theme: 'light' | 'dark';
}

interface DesignContextType {
  figmaDocument: FigmaDocument | null;
  parsedComponents: ExtractedComponent[];
  edsConfig: EdsConfig;
  assets: Asset[];
  setFigmaDocument: (doc: FigmaDocument) => void;
  setParsedComponents: (components: ExtractedComponent[]) => void;
  setEdsConfig: (config: EdsConfig) => void;
  setAssets: (assets: Asset[]) => void;
}

const DesignContext = createContext<DesignContextType | undefined>(undefined);

interface DesignProviderProps {
  children: ReactNode;
}

export const DesignProvider: React.FC<DesignProviderProps> = ({ children }) => {
  const [figmaDocument, setFigmaDocument] = useState<FigmaDocument | null>(null);
  const [parsedComponents, setParsedComponents] = useState<ExtractedComponent[]>([]);
  const [edsConfig, setEdsConfig] = useState<EdsConfig>({
    version: 'latest',
    path: '@eds/vanilla',
    theme: 'dark'
  });
  const [assets, setAssets] = useState<Asset[]>([]);
  
  return (
    <DesignContext.Provider value={{
      figmaDocument,
      parsedComponents,
      edsConfig,
      assets,
      setFigmaDocument,
      setParsedComponents,
      setEdsConfig,
      setAssets
    }}>
      {children}
    </DesignContext.Provider>
  );
};

export const useDesignContext = () => {
  const context = useContext(DesignContext);
  if (context === undefined) {
    throw new Error('useDesignContext must be used within a DesignProvider');
  }
  return context;
};