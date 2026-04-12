import { Search, Bell, ChevronDown, LogOut, Settings, User } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useBranding } from "@/contexts/BrandingContext";
import { useUser } from "@/contexts/UserContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

export function TopBar() {
  const { branding } = useBranding();
  const { user, logout } = useUser();
  const navigate = useNavigate();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <header className="h-14 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4 md:px-6">
      {/* Logo */}
      <div className="flex items-center gap-2 ml-10">
        {branding.logoUrl ? (
          <img src={branding.logoUrl} alt={branding.appName} className="h-8 w-auto max-w-[120px] object-contain" />
        ) : (
          <div className="text-primary font-bold text-2xl tracking-tight">
            <span className="text-primary">A</span>
            <span className="text-sidebar-foreground opacity-80">/</span>
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 md:gap-4">
        <div className="hidden sm:flex relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Pesquisar"
            className="w-48 md:w-64 pl-9 h-9 bg-white dark:bg-muted rounded-full border-0 text-sm"
          />
        </div>

        <Button variant="ghost" size="icon" className="sm:hidden text-sidebar-foreground h-9 w-9">
          <Search className="w-5 h-5" />
        </Button>

        <Button variant="ghost" size="icon" className="text-sidebar-foreground h-9 w-9 relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 h-9 text-sidebar-foreground hover:bg-sidebar-accent">
              <Avatar className="w-8 h-8 border-2 border-sidebar-accent">
                <AvatarImage src={user.photoUrl || undefined} alt={user.name} />
                <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground text-xs">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-xs font-semibold text-sidebar-foreground leading-tight">
                  {user.name.toUpperCase()}
                </span>
                <span className="text-[10px] text-sidebar-foreground/60 leading-tight">
                  {user.email}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-sidebar-foreground/60 hidden md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => navigate("/configuracoes")}>
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
