import React, { ReactNode, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Handle clicks outside the sidebar to close it
  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setSidebarOpen(false);
    }
  };
  
  // Listen for the closeSidebar event from the Sidebar component
  useEffect(() => {
    const handleCloseSidebar = () => setSidebarOpen(false);
    window.addEventListener('closeSidebar', handleCloseSidebar);
    
    // Close sidebar when Escape key is pressed
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscKey);
    
    return () => {
      window.removeEventListener('closeSidebar', handleCloseSidebar);
      window.removeEventListener('keydown', handleEscKey);
    };
  }, []);
  
  const toggleSidebar = () => {
    setSidebarOpen(prevState => !prevState);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar overlay */}
      <div 
        className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ease-in-out ${sidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`} 
        onClick={handleOutsideClick}
      >
        <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
      </div>
      
      {/* Mobile sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 flex z-50 transition-all duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0 opacity-100 visible' : '-translate-x-full opacity-0 invisible lg:opacity-100 lg:visible'} lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-indigo-700 lg:max-w-none lg:w-64 shadow-xl">
          {/* Close button for mobile */}
          <div className="absolute top-0 right-0 -mr-12 pt-2 lg:hidden">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full bg-indigo-800 text-white hover:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          </div>
          <Sidebar />
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar onMenuClick={toggleSidebar} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
