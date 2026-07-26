import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";

const ProfileIcon = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Link to="/login">
        <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
          Iniciar sesión
        </Button>
      </Link>
    );
  }

  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  // Get dashboard path based on user role
  const getDashboardPath = () => {
    switch (user?.role) {
      case 'admin':
        return '/admin';
      case 'owner':
        return '/owner';
      case 'tenant':
        return '/tenant';
      default:
        return '/perfil';
    }
  };

  return (
    <Link to={getDashboardPath()}>
      <Avatar className="cursor-pointer hover:ring-2 hover:ring-primary-foreground/20 transition-all">
        <AvatarFallback className="bg-primary-foreground text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>
    </Link>
  );
};

export default ProfileIcon;
