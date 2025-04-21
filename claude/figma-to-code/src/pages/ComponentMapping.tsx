// src/pages/ComponentMapping.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { useDesignContext } from '../context/DesignContext';
import componentMapper, { EdsComponent } from '../services/componentMapper';

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

const MappingTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  
  th, td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #ddd;
  }
  
  th {
    background-color: #f5f5f5;
    font-weight: 500;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
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

const BackButton = styled(Button)`
  background-color: #f5f5f5;
  color: #333;
  
  &:hover {
    background-color: #e5e5e5;
  }
`;

const ComponentMapping: React.FC = () => {
  const navigate = useNavigate();
  const { parsedComponents } = useDesignContext();
  const [mappedComponents, setMappedComponents] = useState<EdsComponent[]>([]);
  
  useEffect(() => {
    if (parsedComponents && parsedComponents.length > 0) {
      // Map the parsed components to EDS components
      const mapped = componentMapper.mapComponents(parsedComponents);
      setMappedComponents(mapped);
    } else {
      // If no components, go back to import
      navigate('/');
    }
  }, [parsedComponents, navigate]);
  
  const renderComponentMapping = (figmaType: string, edsType: string) => {
    return (
      <tr key={`${figmaType}-${edsType}`}>
        <td>{figmaType}</td>
        <td>{edsType}</td>
      </tr>
    );
  };
  
  // Extract all component mappings
  const mappings: { figmaType: string, edsType: string }[] = [];
  
  const extractMappings = (component: any) => {
    if (component.type) {
      mappings.push({
        figmaType: component.name || 'Unknown',
        edsType: component.type
      });
    }
    
    if (component.children) {
      component.children.forEach(extractMappings);
    }
  };
  
  if (parsedComponents.length > 0) {
    parsedComponents.forEach(extractMappings);
  }
  
  return (
    <Container>
      <Title>Component Mapping</Title>
      <Subtitle>Review how Figma components are mapped to EDS components.</Subtitle>
      
      <MappingTable>
        <thead>
          <tr>
            <th>Figma Component</th>
            <th>EDS Component</th>
          </tr>
        </thead>
        <tbody>
          {mappings.map(mapping => renderComponentMapping(mapping.figmaType, mapping.edsType))}
        </tbody>
      </MappingTable>
      
      <ButtonGroup>
        <BackButton onClick={() => navigate('/eds-import')}>
          Back
        </BackButton>
        <Button onClick={() => navigate('/code-generation')}>
          Continue to Code Generation
        </Button>
      </ButtonGroup>
    </Container>
  );
};

export default ComponentMapping;