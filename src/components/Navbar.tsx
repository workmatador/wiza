
import React from 'react';
import { Button } from "@/components/ui/button";
import { PlaneTakeoff, User, Bell, Menu } from "lucide-react";
import { Link } from 'react-router-dom';
import { useSidebar } from '@/components/ui/sidebar';

const Navbar = () => {
  const { toggleSidebar } = useSidebar();

  return (
    <nav className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 animate-fade-in">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden" 
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-travel-yellow transition-all duration-300 hover:scale-105">
            <div className="bg-travel-yellow text-white p-1.5 rounded-md">
              <PlaneTakeoff size={20} />
            </div>
            <span>VisaDocs</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full relative hover:bg-travel-yellow/10">
            <Bell className="h-5 w-5 text-travel-yellow" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-travel-yellow rounded-full"></span>
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-travel-yellow/10">
            <User className="h-5 w-5 text-travel-yellow" />
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
