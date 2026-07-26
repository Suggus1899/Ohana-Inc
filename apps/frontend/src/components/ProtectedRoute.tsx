import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  redirectTo = '/login'
}) => {
  const { user, isAuthenticated, isLoading, sessionExpired, getRedirectPath } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (isLoading || sessionExpired) return;
    if (redirectedRef.current) return;

    if (!isAuthenticated) {
      redirectedRef.current = true;
      navigate(redirectTo, { state: { from: location }, replace: true });
    } else if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      redirectedRef.current = true;
      const correctPath = getRedirectPath();
      navigate(correctPath, { replace: true });
    }
  }, [isAuthenticated, isLoading, sessionExpired, allowedRoles, user, navigate, redirectTo, location, getRedirectPath]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (sessionExpired || !isAuthenticated) {
    return null;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
