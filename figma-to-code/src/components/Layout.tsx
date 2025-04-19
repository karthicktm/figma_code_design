// src/components/Layout.tsx
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import styled from '@emotion/styled';

const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #ffffff;
`;

const Sidebar = styled.div`
  width: 270px;
  background-color: #f5f5f5;
  border-right: 1px solid #e0e0e0;
  padding: 20px 0;
`;

const MainContent = styled.div`
  flex: 1;
  padding: 30px;
`;

const SidebarTitle = styled.h2`
  margin: 0;
  padding: 0 20px 20px;
  font-size: 18px;
  color: #333;
`;

const SidebarItem = styled(Link)<{ active: boolean }>`
  display: flex;
  align-items: center;
  padding: 12px 20px;
  text-decoration: none;
  color: ${props => props.active ? '#000' : '#666'};
  background-color: ${props => props.active ? '#e8e8e8' : 'transparent'};
  font-weight: ${props => props.active ? '500' : 'normal'};
  margin-bottom: 5px;
  
  &:hover {
    background-color: ${props => props.active ? '#e8e8e8' : '#f0f0f0'};
  }
  
  svg {
    margin-right: 12px;
  }
`;

const StatusIndicator = styled.span<{ status: 'complete' | 'active' | 'pending' }>`
  display: inline-flex;
  width: 20px;
  height: 20px;
  margin-right: 12px;
  border-radius: 50%;
  
  ${props => {
    if (props.status === 'complete') {
      return `
        background-color: #4CAF50;
        color: white;
        justify-content: center;
        align-items: center;
        &:after {
          content: '✓';
          font-size: 12px;
        }
      `;
    } else if (props.status === 'active') {
      return `
        border: 2px solid #1976D2;
        background-color: white;
      `;
    } else {
      return `
        border: 2px solid #bdbdbd;
        background-color: white;
      `;
    }
  }}
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  padding: 0 20px;
  height: 50px;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 20px;
`;

const HeaderTitle = styled.h1`
  margin: 0;
  font-size: 16px;
  font-weight: 500;
`;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  const routes = [
    { path: '/', label: 'Figma Import' },
    { path: '/design-analysis', label: 'Design Analysis' },
    { path: '/eds-import', label: 'EDS Import' },
    { path: '/component-mapping', label: 'Component Mapping' },
    { path: '/code-generation', label: 'Code Generation' },
    { path: '/code-validation', label: 'Code Validation' },
  ];
  
  // Determine status for each route
  const getStatus = (routePath: string) => {
    // Current path is active
    if (routePath === currentPath) return 'active';
    
    // Find index of current path and route path
    const currentIndex = routes.findIndex(r => r.path === currentPath);
    const routeIndex = routes.findIndex(r => r.path === routePath);
    
    // If route comes before current, it's complete
    if (routeIndex < currentIndex) return 'complete';
    
    // Otherwise it's pending
    return 'pending';
  };
  
  return (
    <LayoutContainer>
      <Sidebar>
        <SidebarTitle>Workflow</SidebarTitle>
        
        {routes.map(route => (
          <SidebarItem 
            key={route.path} 
            to={route.path} 
            active={currentPath === route.path}
          >
            <StatusIndicator status={getStatus(route.path) as 'complete' | 'active' | 'pending'} />
            {route.label}
          </SidebarItem>
        ))}
      </Sidebar>
      
      <MainContent>
        <Header>
          <HeaderTitle>Figma-to-Code</HeaderTitle>
        </Header>
        {children}
      </MainContent>
    </LayoutContainer>
  );
};

export default Layout;