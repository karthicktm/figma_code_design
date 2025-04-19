// src/pages/FigmaImport.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import figmaParser from '../services/figmaParser';
import { useDesignContext } from '../context/DesignContext';

const Container = styled.div`
  max-width: 800px;
`;

const Title = styled.h1`
  font-size: 28px;
  margin-bottom: 8px;
  font-weight: 500;
`;

const Subtitle = styled.p`
  color: #666;
  margin-bottom: 30px;
`;

const TabsContainer = styled.div`
  display: flex;
  margin-bottom: 20px;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 10px 20px;
  background-color: ${props => props.active ? '#fff' : '#f5f5f5'};
  border: 1px solid #ddd;
  border-bottom: ${props => props.active ? 'none' : '1px solid #ddd'};
  margin-right: 5px;
  cursor: pointer;
  font-weight: ${props => props.active ? '500' : 'normal'};
  position: relative;
  bottom: -1px;
`;

const TabContent = styled.div`
  border: 1px solid #ddd;
  padding: 20px;
  background-color: #fff;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const HelpText = styled.p`
  color: #666;
  font-size: 14px;
  margin-top: 5px;
`;

const FileUploadArea = styled.div`
  border: 2px dashed #ddd;
  padding: 40px;
  text-align: center;
  margin-bottom: 20px;
  cursor: pointer;
  
  &:hover {
    background-color: #f9f9f9;
  }
`;

const Button = styled.button`
  background-color: #000;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    background-color: #333;
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const FigmaImport: React.FC = () => {
    const [activeTab, setActiveTab] = useState('upload');
    const [figmaApiToken, setFigmaApiToken] = useState('');
    const [figmaFileId, setFigmaFileId] = useState('');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const navigate = useNavigate();
    const { setFigmaDocument, setParsedComponents } = useDesignContext();
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setUploadedFile(event.target.files[0]);
    }
  };
  
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      setUploadedFile(event.dataTransfer.files[0]);
    }
  };
  
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };
  
  const handleFetchDesign = () => {
    // Process Figma API data
    console.log('Fetching design with token:', figmaApiToken, 'and file ID:', figmaFileId);
    // In a real implementation, we would call the Figma API here
    
    // After successfully fetching the design, navigate to the next step
    navigate('/design-analysis');
  };
  
  const handleUploadFile = () => {
    if (!uploadedFile) return;
    
    setIsLoading(true);
    setError(null);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        const document = figmaParser.parseDocument(jsonData);
        const components = figmaParser.extractComponents(document);
        
        setFigmaDocument(document);
        setParsedComponents(components); // This now accepts ExtractedComponent[]
        
        setIsLoading(false);
        navigate('/design-analysis');
      } catch (error) {
        console.error('Error parsing JSON:', error);
        setIsLoading(false);
        setError('Invalid JSON file. Please upload a valid Figma JSON export.');
      }
    };
    reader.readAsText(uploadedFile);
  };
  
  return (
    <Container>
      <Title>Figma Import</Title>
      <Subtitle>Import your Figma design to get started.</Subtitle>
      
      <TabsContainer>
        <Tab 
          active={activeTab === 'upload'} 
          onClick={() => setActiveTab('upload')}
        >
          Upload File
        </Tab>
        <Tab 
          active={activeTab === 'api'} 
          onClick={() => setActiveTab('api')}
        >
          Figma API
        </Tab>
      </TabsContainer>
      
      <TabContent>
        {activeTab === 'upload' ? (
          <>
            <FileUploadArea 
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => document.getElementById('fileInput')?.click()}
            >
              {uploadedFile ? (
                <p>Selected file: {uploadedFile.name}</p>
              ) : (
                <p>Drag and drop your Figma JSON file here, or click to browse</p>
              )}
              <input 
                type="file" 
                id="fileInput" 
                accept=".json" 
                style={{ display: 'none' }} 
                onChange={handleFileChange}
              />
            </FileUploadArea>
            
            <Button 
              onClick={handleUploadFile}
              disabled={!uploadedFile}
            >
              Process File
            </Button>
          </>
        ) : (
          <>
            <FormGroup>
              <Label htmlFor="apiToken">Figma API Token</Label>
              <Input 
                type="password" 
                id="apiToken" 
                value={figmaApiToken}
                onChange={(e) => setFigmaApiToken(e.target.value)}
                placeholder="Enter your Figma API token"
              />
              <HelpText>You can generate a personal access token from your Figma account settings.</HelpText>
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="fileId">Figma File ID</Label>
              <Input 
                type="text" 
                id="fileId" 
                value={figmaFileId}
                onChange={(e) => setFigmaFileId(e.target.value)}
                placeholder="e.g., x9GUiHAkVMGtp0HXvaKDs0"
              />
              <HelpText>The file ID is found in the Figma file URL: figma.com/file/FILE_ID/title</HelpText>
            </FormGroup>
            
            <Button 
              onClick={handleFetchDesign}
              disabled={!figmaApiToken || !figmaFileId}
            >
              Fetch Design
            </Button>
          </>
        )}
      </TabContent>
    </Container>
  );
};

export default FigmaImport;