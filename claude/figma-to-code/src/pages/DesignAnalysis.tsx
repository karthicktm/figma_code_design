// src/pages/DesignAnalysis.tsx
import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';
import { useDesignContext } from '../context/DesignContext';
import { ExtractedComponent } from '../services/figmaParser';

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

const ComponentList = styled.div`
  margin-bottom: 20px;
`;

const ComponentItem = styled.div`
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 12px;
  cursor: pointer;
  
  &:hover {
    background-color: #f9f9f9;
  }
  
  h3 {
    margin: 0 0 8px;
    font-size: 16px;
    font-weight: 500;
  }
  
  .type {
    color: #666;
    font-size: 14px;
  }
  
  .children {
    margin-top: 8px;
    padding-left: 16px;
    border-left: 2px solid #eee;
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
`;

const ComponentDetails = styled.div`
  background-color: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 20px;
  
  h3 {
    margin: 0 0 12px;
    font-size: 16px;
  }
  
  pre {
    background-color: #fff;
    padding: 12px;
    border-radius: 4px;
    overflow: auto;
  }
`;

const DesignAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const { figmaDocument, parsedComponents } = useDesignContext();
  const [selectedComponent, setSelectedComponent] = useState<ExtractedComponent | null>(null);
  
  // If no document is loaded, redirect back to import
  useEffect(() => {
    if (!figmaDocument) {
      navigate('/');
    }
  }, [figmaDocument, navigate]);
  
  const renderComponentTree = (component: ExtractedComponent, depth = 0) => {
    return (
      <ComponentItem 
        key={component.node.id} 
        onClick={(e) => {
          e.stopPropagation();
          setSelectedComponent(component);
        }}
        style={{ marginLeft: `${depth * 16}px` }}
      >
        <h3>{component.name}</h3>
        <div className="type">{component.type}</div>
        
        {component.children && component.children.length > 0 && (
          <div className="children">
            {component.children.map(child => renderComponentTree(child, depth + 1))}
          </div>
        )}
      </ComponentItem>
    );
  };
  
  return (
    <Container>
      <Title>Design Analysis</Title>
      <Subtitle>Review the components extracted from your Figma design.</Subtitle>
      
      {selectedComponent && (
        <ComponentDetails>
          <h3>Component Details: {selectedComponent.name}</h3>
          <pre>{JSON.stringify(selectedComponent, null, 2)}</pre>
        </ComponentDetails>
      )}
      
      <ComponentList>
        {parsedComponents.map(component => renderComponentTree(component))}
      </ComponentList>
      
      <Button onClick={() => navigate('/eds-import')}>
        Continue to EDS Import
      </Button>
    </Container>
  );
};

export default DesignAnalysis;