
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  PlaneTakeoff, 
  Layers, 
  FileText, 
  Settings, 
  Users, 
  HelpCircle,
  ChevronLeft
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { 
  Sidebar as SidebarContainer, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel
} from "@/components/ui/sidebar";

const Sidebar = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const sidebarItems = [
    { path: '/', label: 'Home', icon: Layers },
    { path: '/dashboard', label: 'Dashboard', icon: FileText },
    { path: '/create-application', label: 'Create Application', icon: PlusCircle },
    { path: '/documents', label: 'Documents', icon: Users },
  ];

  const settingsItems = [
    { path: '/settings', label: 'Settings', icon: Settings },
    { path: '/help', label: 'Help', icon: HelpCircle },
  ];

  return (
    <SidebarContainer>
      <SidebarHeader className="flex items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2 text-white">
          <PlaneTakeoff className="h-6 w-6" />
          <span className="text-lg font-bold">Wiza</span>
        </Link>
        <SidebarTrigger>
          <ChevronLeft className="h-5 w-5" />
        </SidebarTrigger>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild>
                    <Link 
                      to={item.path} 
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md",
                        isActive(item.path) && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild>
                    <Link 
                      to={item.path} 
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md",
                        isActive(item.path) && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-4 py-4">
        <div className="text-xs text-white/70">
          © 2023 Wiza
        </div>
      </SidebarFooter>
    </SidebarContainer>
  );
};

export default Sidebar;
