import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ExchangeRateBadge, ExchangeRateBadgeMobile } from "../common/ExchangeRateBadge";
import { Logo } from "./Logo";
import { 
  Menu, 
  Home, 
  Building, 
  User, 
  LogOut, 
  Settings,
  Shield,
  Eye,
  Info,
  MapPin,
  FileText
} from "lucide-react";

import { SidebarItem } from "./Sidebar";

interface NavbarProps {
  variant?: "default" | "dashboard";
  dashboardItems?: SidebarItem[];
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

const navLinks = [
  { href: "/", label: "Inicio", icon: Home, section: null },
  { href: "/#propiedades", label: "Propiedades", icon: Building, section: "propiedades" },
  { href: "/#como-funciona", label: "Cómo Funciona", icon: Info, section: "como-funciona" },
  { href: "/#ubicacion", label: "Ubicación", icon: MapPin, section: "ubicacion" },
  { href: "/terminos", label: "Términos", icon: FileText, section: null },
  { href: "/politicas", label: "Políticas", icon: Shield, section: null },
];

const Navbar = ({ 
  variant = "default",
  dashboardItems,
  activeSection,
  onSectionChange
}: NavbarProps) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle hash navigation on page load
  useEffect(() => {
    if (location.hash) {
      const sectionId = location.hash.substring(1);
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [location]);

  const handleLogout = () => {
    logout();
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión exitosamente",
    });
    navigate("/");
  };

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const getDashboardPath = () => {
    if (!user) return "/perfil";
    switch (user.role) {
      case "admin": return "/admin";
      case "propietario": return "/propietario";
      case "cliente": return "/cliente";
      case "estudiante": return "/estudiante";
      case "operator": return "/operator";
      default: return "/perfil";
    }
  };

  const getDashboardIcon = () => {
    if (!user) return <User className="w-4 h-4" />;
    switch (user.role) {
      case "admin": return <Shield className="w-4 h-4" />;
      case "propietario": return <Building className="w-4 h-4" />;
      case "operator": return <Eye className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, section: string | null) => {
    if (section) {
      e.preventDefault();
      
      // Si estamos en la página de inicio
      if (window.location.pathname === '/') {
        const element = document.getElementById(section);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        // Si estamos en otra página, navegar al inicio con el hash
        navigate(`/#${section}`);
        // Después de navegar, hacer scroll
        setTimeout(() => {
          const element = document.getElementById(section);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    }
  };

  return (
    <nav className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${
      variant === "dashboard" ? "border-border" : ""
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo wordmarkClassName="font-bold text-lg hidden sm:inline" />
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.section)}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <ExchangeRateBadge />
            {isAuthenticated && <ExchangeRateBadgeMobile />}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger data-tutorial="user-menu" className="relative h-9 w-9 rounded-full ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-accent hover:text-accent-foreground">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center gap-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{user?.name}</span>
                      <span className="text-xs text-muted-foreground capitalize">{user?.role}</span>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={getDashboardPath()} className="flex items-center gap-2 cursor-pointer">
                      {getDashboardIcon()}
                      <span>Mi Panel</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={getDashboardPath()} state={{ activeSection: 'settings' }} className="flex items-center gap-2 cursor-pointer">
                      <Settings className="w-4 h-4" />
                      <span>Perfil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2">
                <Link to="/login">
                  <Button variant="outline" size="sm" className="h-8 sm:h-9 px-2 sm:px-3 text-xs border-primary">
                    Iniciar sesión
                  </Button>
                </Link>
                <Link to="/registro">
                  <Button variant="outline" size="sm" className="h-8 sm:h-9 px-2 sm:px-3 text-xs border-primary">
                    Registrarse
                  </Button>
                </Link>
              </div>
            )}

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger data-tutorial="sidebar-mobile-trigger" asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="flex flex-col gap-1 mt-6">
                  {variant === "dashboard" && dashboardItems ? (
                    dashboardItems.map((item) => (
                      <button
                        key={item.id}
                        data-tutorial={`sidebar-mobile-item-${item.id}`}
                        onClick={() => {
                          if (item.href) {
                            navigate(item.href);
                          } else if (onSectionChange) {
                            onSectionChange(item.id);
                          }
                          setMobileMenuOpen(false);
                        }}
                        className={`flex items-center gap-2 text-sm font-medium transition-colors py-1.5 px-2 rounded-md w-full text-left ${
                          activeSection === item.id 
                            ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                            : "hover:bg-accent text-muted-foreground hover:text-accent-foreground"
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="flex-1">{item.label}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                            {item.badge > 99 ? "99+" : item.badge}
                          </span>
                        )}
                      </button>
                    ))
                  ) : (
                    navLinks.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        onClick={(e) => {
                          handleNavClick(e, link.section);
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors py-1.5 px-2 rounded-md cursor-pointer"
                      >
                        {link.icon && <link.icon className="h-4 w-4" />}
                        {link.label}
                      </a>
                    ))
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
