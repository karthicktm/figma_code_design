// src/pages/CodeValidation.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';

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

const ValidationResults = styled.div`
  background-color: #f5f5f5;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 20px;
`;

const ValidationItem = styled.div<{ status: 'pass' | 'warning' | 'error' }>`
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ddd;
  
  &:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }
  
  .icon {
    flex: 0 0 24px;
    margin-right: 12px;
    color: ${props => props.status === 'pass' ? '#4caf50' : props.status === 'warning' ? '#ff9800' : '#f44336'};
  }
  
  .details {
    flex: 1;
    
    h3 {
      margin: 0 0 4px;
      font-size: 16px;
      font-weight: 500;
    }
    
    p {
      margin: 0;
      color: #666;
    }
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

const DoneButton = styled(Button)`
  background-color: #4caf50;
  
  &:hover {
    background-color: #45a049;
  }
`;

const CodeValidation: React.FC = () => {
  const navigate = useNavigate();
  
  // In a real implementation, we would perform actual code validation
  // For now, we'll just show mock validation results
  const validationResults = [
    {
      id: 1,
      status: 'pass' as const,
      title: 'Angular Component Structure',
      message: 'Component follows Angular best practices.'
    },
    {
      id: 2,
      status: 'pass' as const,
      title: 'EDS Component Usage',
      message: 'All components are using EDS correctly.'
    },
    {
      id: 3,
      status: 'warning' as const,
      title: 'Accessibility',
      message: 'Some form elements may need additional ARIA attributes.'
    },
    {
      id: 4,
      status: 'pass' as const,
      title: 'Form Validation',
      message: 'Form validation is implemented correctly.'
    }
  ];
  
  const handleDone = () => {
    // In a real implementation, we might send the code somewhere or save it
    // For now, we'll just go back to the start
    navigate('/');
  };
  
  return (
    <Container>
      <Title>Code Validation</Title>
      <Subtitle>Review validation results for the generated code.</Subtitle>
      
      <ValidationResults>
        {validationResults.map(result => (
          <ValidationItem key={result.id} status={result.status}>
            <div className="icon">
              {result.status === 'pass' && '✓'}
              {result.status === 'warning' && '⚠️'}
              {(result.status as 'pass' | 'warning' | 'error') === 'error' && '✗'}
            </div>
            <div className="details">
              <h3>{result.title}</h3>
              <p>{result.message}</p>
            </div>
          </ValidationItem>
        ))}
      </ValidationResults>
      
      <ButtonGroup>
        <BackButton onClick={() => navigate('/code-generation')}>
          Back
        </BackButton>
        <DoneButton onClick={handleDone}>
          Done
        </DoneButton>
      </ButtonGroup>
    </Container>
  );
};

export default CodeValidation;