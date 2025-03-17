
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { SidebarProvider } from "@/components/ui/sidebar";

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <Navbar />
            <main className="flex-1 px-4 py-6 md:px-6 md:py-8 lg:px-8 animate-fade-in">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default AppLayout;
