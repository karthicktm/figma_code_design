// src/App.tsx (updated)
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import FigmaImport from './pages/FigmaImport';
import DesignAnalysis from './pages/DesignAnalysis';
import EdsImport from './pages/EdsImport';
import ComponentMapping from './pages/ComponentMapping';
import CodeGeneration from './pages/CodeGeneration';
import CodeValidation from './pages/CodeValidation';
import { DesignProvider } from './context/DesignContext';

function App() {
  return (
    <DesignProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<FigmaImport />} />
            <Route path="/design-analysis" element={<DesignAnalysis />} />
            <Route path="/eds-import" element={<EdsImport />} />
            <Route path="/component-mapping" element={<ComponentMapping />} />
            <Route path="/code-generation" element={<CodeGeneration />} />
            <Route path="/code-validation" element={<CodeValidation />} />
          </Routes>
        </Layout>
      </Router>
    </DesignProvider>
  );
}

export default App;