import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BarChart3, LogOut, User } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

interface NavigationProps {
  userRole: 'user' | 'admin' | 'demo';
  onLogout: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Navigation = ({ userRole, onLogout, activeTab, onTabChange }: NavigationProps) => {
  return (
    <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href="/"
                    className="flex items-center gap-2 group focus:outline-none"
                    tabIndex={0}
                  >
                    <BarChart3 className="h-8 w-8 text-blue-600 group-hover:scale-110 group-hover:text-purple-600 transition-transform duration-200" />
                    <span className="text-xl font-bold text-gray-900 group-hover:underline group-hover:text-purple-700 transition-colors duration-200">
                      Excel Analytics
                    </span>
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  Go to Home
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="capitalize">{userRole}</span>
              {userRole === 'admin' && (
                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
                  Admin
                </span>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem onClick={onLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};
