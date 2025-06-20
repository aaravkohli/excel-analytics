
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { BarChart3, LogOut, User, Menu } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { useState } from "react";

interface NavigationProps {
  userRole: 'user' | 'admin' | 'demo';
  onLogout: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Navigation = ({ userRole, onLogout, activeTab, onTabChange }: NavigationProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: 'upload', label: 'Upload', icon: '📤' },
    { id: 'preview', label: 'Preview', icon: '👁️' },
    { id: 'charts', label: 'Charts', icon: '📊' },
    { id: 'history', label: 'History', icon: '📋' },
    ...(userRole === 'admin' ? [{ id: 'admin', label: 'Admin', icon: '🛡️' }] : [])
  ];

  return (
    <nav className="bg-white/95 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href="/"
                    className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg p-1 transition-all duration-200"
                    tabIndex={0}
                  >
                    <div className="relative">
                      <BarChart3 className="h-8 w-8 text-blue-600 group-hover:text-purple-600 transition-all duration-300 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-blue-600/20 rounded-full scale-0 group-hover:scale-150 transition-transform duration-300 opacity-0 group-hover:opacity-100"></div>
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-700 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
                      Excel Analytics
                    </span>
                  </a>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-gray-900 text-white border-0">
                  <p>Go to Home</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "default" : "ghost"}
                size="sm"
                onClick={() => onTabChange(item.id)}
                className={`relative transition-all duration-200 ${
                  activeTab === item.id
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                    : "hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
                {activeTab === item.id && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>
                )}
              </Button>
            ))}
          </div>

          {/* User Menu & Mobile Toggle */}
          <div className="flex items-center gap-3">
            {/* User Role Badge */}
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="text-gray-600 capitalize font-medium">{userRole}</span>
              {userRole === 'admin' && (
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                  Admin
                </span>
              )}
              {userRole === 'demo' && (
                <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                  Demo
                </span>
              )}
            </div>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:ring-2 hover:ring-blue-500/20 transition-all duration-200">
                  <Avatar className="h-9 w-9 ring-2 ring-gray-200 hover:ring-blue-500 transition-all duration-200">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white/95 backdrop-blur-lg border border-gray-200/50 shadow-xl" align="end" forceMount>
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">Signed in as</p>
                  <p className="text-sm text-gray-600 capitalize">{userRole} Account</p>
                </div>
                <DropdownMenuItem 
                  onClick={onLogout}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer transition-colors duration-200"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Toggle */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden hover:bg-gray-100 transition-colors duration-200">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 bg-white/95 backdrop-blur-lg border-l border-gray-200/50">
                <div className="flex flex-col gap-4 mt-8">
                  <div className="px-3 py-2 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-900">Navigation</p>
                    <p className="text-xs text-gray-600 capitalize mt-1">{userRole} account</p>
                  </div>
                  
                  {navItems.map((item) => (
                    <Button
                      key={item.id}
                      variant={activeTab === item.id ? "default" : "ghost"}
                      className={`justify-start transition-all duration-200 ${
                        activeTab === item.id
                          ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => {
                        onTabChange(item.id);
                        setIsOpen(false);
                      }}
                    >
                      <span className="mr-3">{item.icon}</span>
                      {item.label}
                    </Button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};
