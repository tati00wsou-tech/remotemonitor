import React from 'react';
import Navigation from './Navigation';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="flex-1 overflow-auto md:ml-64">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}
