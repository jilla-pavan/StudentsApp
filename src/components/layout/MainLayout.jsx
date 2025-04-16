import React from 'react';
import renderSidebar from '../SideBar';

const MainLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-white">
      {renderSidebar()}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout; 