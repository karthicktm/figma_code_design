// src/pages/EdsImport.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { useDesignContext } from '../context/DesignContext';

const Container = styled.div`
  max-width: 800px;
`;

const Title = styled.h1`
  font-size: 28px;
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  color: #666;
  margin-bottom: 30px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const Select = styled.select`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
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
`;

const BackButton = styled(Button)`
  background-color: #f5f5f5;
  color: #333;
`;

const AssetSection = styled.div`
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
`;

const AssetTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 15px;
`;

const AddButton = styled.button`
  background-color: #4caf50;
  color: white;
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  margin-top: 10px;
  cursor: pointer;
`;

const FileUpload = styled.div`
  margin-top: 10px;
  border: 1px dashed #ddd;
  padding: 15px;
  text-align: center;
  cursor: pointer;
`;

interface Asset {
  id: string;
  type: 'font' | 'icon' | 'image';
  name: string;
  file: File | null;
  path: string;
}

const EdsImport: React.FC = () => {
  const navigate = useNavigate();
  const { edsConfig, setEdsConfig, assets, setAssets } = useDesignContext();
  const [edsVersion, setEdsVersion] = useState(edsConfig.version);
  const [edsPath, setEdsPath] = useState(edsConfig.path);
  const [theme, setTheme] = useState<'light' | 'dark'>(edsConfig.theme);
  const [newAssetType, setNewAssetType] = useState<'font' | 'icon' | 'image'>('icon');
  const [newAssetName, setNewAssetName] = useState('');
  
  const handleAddAsset = () => {
    if (newAssetName.trim() === '') return;
    
    const newAsset: Asset = {
      id: Date.now().toString(),
      type: newAssetType,
      name: newAssetName,
      file: null,
      path: `assets/${newAssetType}s/${newAssetName}`
    };
    
    setAssets([...assets, newAsset]);
    setNewAssetName('');
  };
  
  const handleFileChange = (id: string, file: File) => {
    setAssets(assets.map(asset => 
      asset.id === id ? { ...asset, file } : asset
    ));
  };
  
  const handleRemoveAsset = (id: string) => {
    setAssets(assets.filter(asset => asset.id !== id));
  };
  
  const handleContinue = () => {
    // Save values to context
    setEdsConfig({
      version: edsVersion,
      path: edsPath,
      theme: theme as 'light' | 'dark'
    });
    navigate('/component-mapping');
  };
  
  return (
    <Container>
      <Title>EDS Import</Title>
      <Subtitle>Configure the EDS component library settings and upload assets.</Subtitle>
      
      {/* EDS Configuration */}
      <FormGroup>
        <Label htmlFor="edsPath">EDS Library Path</Label>
        <Input 
          type="text" 
          id="edsPath" 
          value={edsPath}
          onChange={(e) => setEdsPath(e.target.value)}
          placeholder="e.g., @eds/vanilla"
        />
      </FormGroup>
      
      <FormGroup>
        <Label htmlFor="edsVersion">EDS Version</Label>
        <Input 
          type="text" 
          id="edsVersion" 
          value={edsVersion}
          onChange={(e) => setEdsVersion(e.target.value)}
          placeholder="e.g., latest, 1.0.0"
        />
      </FormGroup>
      
      <FormGroup>
        <Label htmlFor="theme">Default Theme</Label>
        <Select 
          id="theme" 
          value={theme}
          onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </Select>
      </FormGroup>
      
      {/* Asset Management */}
      <AssetSection>
        <h2>Asset Management</h2>
        <p>Add fonts, icons, and images used in your Figma design.</p>
        
        {assets.length > 0 && (
          <AssetTable>
            <thead>
              <tr>
                <th>Type</th>
                <th>Name</th>
                <th>Path</th>
                <th>File</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.map(asset => (
                <tr key={asset.id}>
                  <td>{asset.type}</td>
                  <td>{asset.name}</td>
                  <td>{asset.path}</td>
                  <td>{asset.file ? asset.file.name : 'No file'}</td>
                  <td>
                    <input 
                      type="file" 
                      id={`file-${asset.id}`} 
                      style={{ display: 'none' }} 
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleFileChange(asset.id, e.target.files[0]);
                        }
                      }}
                    />
                    <Button onClick={() => document.getElementById(`file-${asset.id}`)?.click()}>
                      Upload
                    </Button>
                    <Button onClick={() => handleRemoveAsset(asset.id)}>
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </AssetTable>
        )}
        
        <FormGroup>
          <Label>Add New Asset</Label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Select 
              value={newAssetType}
              onChange={(e) => setNewAssetType(e.target.value as 'font' | 'icon' | 'image')}
              style={{ flex: '0 0 100px' }}
            >
              <option value="font">Font</option>
              <option value="icon">Icon</option>
              <option value="image">Image</option>
            </Select>
            <Input 
              type="text" 
              value={newAssetName}
              onChange={(e) => setNewAssetName(e.target.value)}
              placeholder="Asset name (e.g., logo.svg, ericsson-hilda.woff)"
              style={{ flex: '1' }}
            />
            <AddButton onClick={handleAddAsset}>
              Add
            </AddButton>
          </div>
        </FormGroup>
      </AssetSection>
      
      <ButtonGroup>
        <BackButton onClick={() => navigate('/DesignAnalysis')}>
          Back
        </BackButton>
        <Button onClick={handleContinue}>
          Continue to Component Mapping
        </Button>
      </ButtonGroup>
    </Container>
  );
};

export default EdsImport;