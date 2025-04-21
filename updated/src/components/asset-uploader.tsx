// src/components/asset-uploader.tsx
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AssetUploaderProps {
  assetType: 'images' | 'icons' | 'fonts';
  onUpload: (files: File[]) => void;
  missingAssets?: string[];
}

export function AssetUploader({ assetType, onUpload, missingAssets = [] }: AssetUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  
  const acceptMap = {
    images: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    icons: {
      'image/svg+xml': ['.svg'],
      'image/*': ['.png']
    },
    fonts: {
      'font/*': ['.ttf', '.woff', '.woff2', '.otf']
    }
  };
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: acceptMap[assetType],
    onDrop: (acceptedFiles) => {
      setFiles([...files, ...acceptedFiles]);
    }
  });
  
  const handleUpload = () => {
    onUpload(files);
    setFiles([]); // Clear the files after upload
  };
  
  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };
  
  const getAssetTypeText = () => {
    switch (assetType) {
      case 'images': 
        return 'Images';
      case 'icons': 
        return 'Icons';
      case 'fonts': 
        return 'Fonts';
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload {getAssetTypeText()}</CardTitle>
      </CardHeader>
      <CardContent>
        {missingAssets.length > 0 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded">
            <p className="text-sm font-medium text-amber-800 mb-1">Missing {getAssetTypeText()}:</p>
            <ul className="list-disc list-inside">
              {missingAssets.map((asset, index) => (
                <li key={index} className="text-xs text-amber-700">{asset}</li>
              ))}
            </ul>
          </div>
        )}

        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center gap-2">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-8 w-8 text-gray-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-sm text-gray-600">
              Drag & drop {assetType} here, or click to select files
            </p>
            <p className="text-xs text-gray-500">
              {assetType === 'images' && 'Accepts PNG, JPG, JPEG, WEBP'}
              {assetType === 'icons' && 'Accepts SVG, PNG'}
              {assetType === 'fonts' && 'Accepts TTF, WOFF, WOFF2, OTF'}
            </p>
          </div>
        </div>
        
        {files.length > 0 && (
          <div className="mt-4 space-y-4">
            <div className="text-sm font-medium">Selected files:</div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {files.map((file, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-2 bg-gray-50 border rounded"
                >
                  <div className="flex items-center space-x-2 truncate max-w-[80%]">
                    <span className="text-xs font-medium truncate">{file.name}</span>
                    <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button 
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                    aria-label="Remove file"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-4 w-4" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M6 18L18 6M6 6l12 12" 
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            
            <Button 
              onClick={handleUpload}
              className="w-full"
            >
              Upload {files.length} {files.length === 1 ? 'file' : 'files'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}// Component files will go here 
