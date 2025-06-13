import React from 'react';

interface SidebarProps {
  children: React.ReactNode;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ children, className = '' }) => {
  return (
    <aside className={`bg-white border-r border-gray-200 ${className}`}>
      {children}
    </aside>
  );
}; 