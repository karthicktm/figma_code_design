// src/modules/component-recognition/recognized-components-list.tsx
import React, { useState } from 'react';
import { RecognizedComponent } from '@/types/agent-interfaces';

interface RecognizedComponentsListProps {
  components: RecognizedComponent[];
}

export function RecognizedComponentsList({ components }: RecognizedComponentsListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  
  const componentsPerPage = 10;
  
  // Get unique component types for filtering
  const componentTypes = Array.from(new Set(components.map(c => c.edsComponentType || 'Other')));
  
  // Filter components
  const filteredComponents = components.filter(component => {
    const matchesSearch = 
      component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (component.edsComponentType && component.edsComponentType.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = !filterType || component.edsComponentType === filterType;
    
    return matchesSearch && matchesType;
  });
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredComponents.length / componentsPerPage);
  const indexOfLastComponent = currentPage * componentsPerPage;
  const indexOfFirstComponent = indexOfLastComponent - componentsPerPage;
  const currentComponents = filteredComponents.slice(indexOfFirstComponent, indexOfLastComponent);
  
  // Handle page changes
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  
  // Reset pagination when filter changes
  const handleFilterChange = (type: string) => {
    setFilterType(type);
    setCurrentPage(1);
  };
  
  // Reset pagination when search changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };
  
  return (
    <div className="space-y-4">
      {/* Search and filter controls */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search components..."
            className="w-full px-3 py-2 border rounded-md"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <div>
          <select
            className="px-3 py-2 border rounded-md"
            value={filterType}
            onChange={(e) => handleFilterChange(e.target.value)}
          >
            <option value="">All Types</option>
            {componentTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Components table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Component Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Properties
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dimensions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentComponents.map((component, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{component.name}</div>
                  <div className="text-xs text-gray-500">ID: {component.id.substring(0, 8)}...</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {component.edsComponentType || 'Unknown'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500 max-w-xs truncate">
                    {Object.keys(component.properties || {}).map(key => (
                      <span key={key} className="mr-2">
                        {key}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {component.layout ? `${component.layout.width} × ${component.layout.height}` : '--'}
                </td>
              </tr>
            ))}
            
            {currentComponents.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                  No components found matching your criteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{indexOfFirstComponent + 1}</span> to{' '}
            <span className="font-medium">
              {Math.min(indexOfLastComponent, filteredComponents.length)}
            </span>{' '}
            of <span className="font-medium">{filteredComponents.length}</span> components
          </div>
          <nav className="flex justify-end">
            <ul className="flex items-center">
              <li>
                <button
                  onClick={() => paginate(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
              </li>
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                // Calculate page numbers to show (centered around current page)
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <li key={i}>
                    <button
                      onClick={() => paginate(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === pageNum
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  </li>
                );
              })}
              <li>
                <button
                  onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}