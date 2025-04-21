// src/modules/style-extraction/styles-typography-panel.tsx
import React from 'react';
import { ExtractedStyles } from '@/types/agent-interfaces';

interface StylesTypographyPanelProps {
  typography: ExtractedStyles['typography'];
}

export function StylesTypographyPanel({ typography }: StylesTypographyPanelProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {typography.map((style, index) => (
          <div key={index} className="border rounded-md p-4">
            <div className="mb-3">
              <h4 className="font-medium text-sm text-gray-500">{style.name}</h4>
              <p 
                className="mt-2" 
                style={{
                  fontFamily: style.fontFamily,
                  fontSize: style.fontSize,
                  fontWeight: style.fontWeight,
                  lineHeight: style.lineHeight,
                  letterSpacing: style.letterSpacing
                }}
              >
                The quick brown fox jumps over the lazy dog
              </p>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Font Family</span>
                <span className="font-mono">{style.fontFamily}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Font Size</span>
                <span className="font-mono">{style.fontSize}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Font Weight</span>
                <span className="font-mono">{style.fontWeight}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Line Height</span>
                <span className="font-mono">{style.lineHeight}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Letter Spacing</span>
                <span className="font-mono">{style.letterSpacing}</span>
              </div>
              {style.edsVariable && (
                <div className="flex justify-between text-gray-600">
                  <span>Variable</span>
                  <span className="font-mono">{style.edsVariable}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}