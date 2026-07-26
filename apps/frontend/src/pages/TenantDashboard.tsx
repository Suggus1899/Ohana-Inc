import { useState, useEffect, lazy, Suspense, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useUnreadBadges } from "@/hooks/useUnreadBadges";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { clientSidebarItems } from "@/config/sidebarConfig";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useDriver } from "@/hooks/useDriver";
import { getTutorialSteps, onMobileHighlightStarted } from "@/config/tutorialSteps";
import { api } from "@/services/api";
import { fireCelebration } from "@/utils/confetti";
import "@/styles/driver-overrides.css";

// Client sections - Solo lectura, sin CRUD (lazy loaded)
const DiscoverSection = lazy(() => import("@/components/dashboard/tenant/DiscoverSection"));
const FavoritesSection = lazy(() => import("@/components/dashboard/tenant/FavoritesSection"));
const RequestsSection = lazy(() => import("@/components/dashboard/tenant/RequestsSection"));
const MessagesSection = lazy(() => import("@/components/dashboard/shared/MessagesSection"));
const SettingsSection = lazy(() => import("@/components/dashboard/shared/SettingsSection"));
const KYCClientStatus = lazy(() => import("@/components/kyc/KYCClientStatus").then(m => ({ default: m.KYCClientStatus })));
const TransactionPanel = lazy(() => import("@/components/transactions/TransactionPanel"));
const UserReviewsSection = lazy(() => import("@/components/reviews/UserReviewsSection"));
const NotificationsSection = lazy(() => import("@/components/notifications/NotificationsSection"));
const HelpSection = lazy(() => import("@/components/dashboard/tenant/HelpSection"));

// Placeholder sections
const PlaceholderSection = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
    <p className="text-muted-foreground">Sección "{title}" en desarrollo</p>
  </div>
);

// Panel Cliente / Estudiante: Solo puede consumir información (reutiliza el mismo componente)
const TenantDashboard = () => {
  const [activeSection, setActiveSection] = useState("home");
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const { messages: unreadMessages } = useUnreadBadges();
  const location = useLocation();

  const celebrationFired = useRef(false);

  const saveTutorialCompleted = useCallback(async () => {
    try {
      await api.markTutorialCompleted();
    } catch (err) {
      console.error('Error al marcar tutorial completado:', err);
      toast({
        title: 'Error al guardar',
        description: 'No se pudo guardar el progreso del tutorial. Volverá a aparecer al recargar la página.',
        variant: 'destructive',
      });
    }
  }, []);

  const handleTutorialDone = useCallback(async () => {
    setUser((prev) => prev ? { ...prev, tutorialCompleted: true } : prev);
    await saveTutorialCompleted();
    if (!celebrationFired.current) {
      celebrationFired.current = true;
      fireCelebration();
    }
  }, [updateUser, saveTutorialCompleted]);

  const handleTutorialSkip = useCallback(async () => {
    setUser((prev) => prev ? { ...prev, tutorialCompleted: true } : prev);
    await saveTutorialCompleted();
  }, [updateUser, saveTutorialCompleted]);

  const steps = getTutorialSteps(user?.name || '', clientSidebarItems, user?.role);
  const { startTutorial } = useDriver(steps, {
    onDone: handleTutorialDone,
    onSkip: handleTutorialSkip,
    onHighlightStarted: onMobileHighlightStarted,
  });

  // Show tutorial for new users on first login
  useEffect(() => {
    if (user && !user.tutorialCompleted) {
      celebrationFired.current = false;
      const timer = setTimeout(() => startTutorial(), 800);
      return () => clearTimeout(timer);
    }
  }, [user, startTutorial]);

  // Manejar state de navegación (ej: desde PropertyDetail)
  useEffect(() => {
    const state = location.state as { activeSection?: string };
    if (state?.activeSection) {
      setActiveSection(state.activeSection);
      // Limpiar el state para no repetir la acción al refrescar
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const renderSection = () => {
    switch (activeSection) {
      case "home":
        return <DiscoverSection />;
      case "favorites":
        return <FavoritesSection />;
      case "requests":
        return <RequestsSection />;
      case "transactions":
        return user ? <TransactionPanel currentUserId={user.id} /> : null;
      case "verificacion":
        return user ? <KYCClientStatus /> : null;
      case "messages":
        return <MessagesSection />;
      case "reviews":
        return user ? <UserReviewsSection userId={user.id} userName={user.name} /> : null;
      case "notifications":
        return <NotificationsSection />;
      case "help":
        return <HelpSection />;
      case "settings":
        return <SettingsSection />;
      default:
        return <DiscoverSection />;
    }
  };

  return (
    <DashboardLayout
      sidebarItems={clientSidebarItems}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      role={user?.role ?? 'cliente'}
      sidebarBadges={{ messages: unreadMessages }}
    >
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center min-h-[300px] bg-background">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-2 text-sm text-muted-foreground animate-pulse font-medium">Cargando sección...</p>
        </div>
      }>
        {renderSection()}
      </Suspense>
    </DashboardLayout>
  );
};

export default TenantDashboard;
