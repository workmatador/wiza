
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Database, Home } from 'lucide-react';

export const SidebarLinks = () => {
  return (
    <div className="space-y-1">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `flex items-center gap-2 rounded-lg px-3 py-2 transition-all duration-300 ease-in-out ${
            isActive 
              ? "bg-[#fcb415] text-black font-medium" 
              : "text-muted-foreground hover:bg-[#fcb415]/20 hover:text-black"
          }`
        }
      >
        <Home className="h-4 w-4" />
        <span>Home</span>
      </NavLink>
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          `flex items-center gap-2 rounded-lg px-3 py-2 transition-all duration-300 ease-in-out ${
            isActive 
              ? "bg-[#fcb415] text-black font-medium" 
              : "text-muted-foreground hover:bg-[#fcb415]/20 hover:text-black"
          }`
        }
      >
        <LayoutDashboard className="h-4 w-4" />
        <span>Dashboard</span>
      </NavLink>
      <NavLink
        to="/create-application"
        className={({ isActive }) =>
          `flex items-center gap-2 rounded-lg px-3 py-2 transition-all duration-300 ease-in-out ${
            isActive 
              ? "bg-[#fcb415] text-black font-medium" 
              : "text-muted-foreground hover:bg-[#fcb415]/20 hover:text-black"
          }`
        }
      >
        <PlusCircle className="h-4 w-4" />
        <span>Create Application</span>
      </NavLink>
      <NavLink
        to="/documents"
        className={({ isActive }) =>
          `flex items-center gap-2 rounded-lg px-3 py-2 transition-all duration-300 ease-in-out ${
            isActive 
              ? "bg-[#fcb415] text-black font-medium" 
              : "text-muted-foreground hover:bg-[#fcb415]/20 hover:text-black"
          }`
        }
      >
        <Database className="h-4 w-4" />
        <span>Document Storage</span>
      </NavLink>
    </div>
  );
};
