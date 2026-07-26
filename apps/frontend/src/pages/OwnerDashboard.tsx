import { useState, useEffect, lazy, Suspense, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useUnreadBadges } from "@/hooks/useUnreadBadges";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ownerSidebarItems } from "@/config/sidebarConfig";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useDriver } from "@/hooks/useDriver";
import { getTutorialSteps, onMobileHighlightStarted } from "@/config/tutorialSteps";
import { api } from "@/services/api";
import { fireCelebration } from "@/utils/confetti";
import "@/styles/driver-overrides.css";

// Owner sections (lazy loaded)
const HomeSection = lazy(() => import("@/components/dashboard/owner/HomeSection"));
const PropertiesSection = lazy(() => import("@/components/dashboard/owner/PropertiesSection"));
const ReceivedRequestsSection = lazy(() => import("@/components/dashboard/owner/ReceivedRequestsSection"));
const StatsSection = lazy(() => import("@/components/dashboard/owner/StatsSection"));
const MessagesSection = lazy(() => import("@/components/dashboard/shared/MessagesSection"));
const SettingsSection = lazy(() => import("@/components/dashboard/shared/SettingsSection"));
const KYCFlow = lazy(() => import("@/components/kyc/KYCFlow").then(m => ({ default: m.KYCFlow })));
const KYCErrorBoundary = lazy(() => import("@/components/kyc/KYCErrorBoundary").then(m => ({ default: m.KYCErrorBoundary })));
const TransactionPanel = lazy(() => import("@/components/transactions/TransactionPanel"));
const UsersSection = lazy(() => import("@/components/dashboard/owner/UsersSection"));
const VisitsSection = lazy(() => import("@/components/dashboard/owner/VisitsSection"));
const UserReviewsSection = lazy(() => import("@/components/reviews/UserReviewsSection"));
const HelpSection = lazy(() => import("@/components/dashboard/tenant/HelpSection"));

const OwnerDashboard = () => {
  const [activeSection, setActiveSection] = useState("home");
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const { messages: unreadMessages } = useUnreadBadges();
  const location = useLocation();

  useEffect(() => {
    const state = location.state as { activeSection?: string };
    if (state?.activeSection) {
      setActiveSection(state.activeSection);
    }
  }, [location]);

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
  }, [setUser, saveTutorialCompleted]);

  const handleTutorialSkip = useCallback(async () => {
    setUser((prev) => prev ? { ...prev, tutorialCompleted: true } : prev);
    await saveTutorialCompleted();
  }, [setUser, saveTutorialCompleted]);

  const steps = getTutorialSteps(user?.name || '', ownerSidebarItems, user?.role);
  const { startTutorial } = useDriver(steps, {
    onDone: handleTutorialDone,
    onSkip: handleTutorialSkip,
    onHighlightStarted: onMobileHighlightStarted,
  });

  useEffect(() => {
    if (user && !user.tutorialCompleted) {
      celebrationFired.current = false;
      const timer = setTimeout(() => startTutorial(), 800);
      return () => clearTimeout(timer);
    }
  }, [user, startTutorial]);

  const handleKYCComplete = () => {
    toast({
      title: "Verificación Completada",
      description: "Tu verificación ha sido enviada y está siendo procesada.",
    });
    setActiveSection("home");
  };

  const handleKYCError = (error: Error) => {
    toast({
      title: "Error en Verificación",
      description: error.message,
      variant: "destructive",
    });
  };

  const renderSection = () => {
    switch (activeSection) {
      case "home":
        return <HomeSection onNavigate={setActiveSection} />;
      case "properties":
        return <PropertiesSection />;
      case "requests":
        return <ReceivedRequestsSection />;
      case "transactions":
        return user ? <TransactionPanel currentUserId={user.id} /> : null;
      case "verificacion":
        return user ? (
          <KYCErrorBoundary onError={handleKYCError}>
            <KYCFlow
              userId={user.id}
              onComplete={handleKYCComplete}
              onError={handleKYCError}
            />
          </KYCErrorBoundary>
        ) : null;
      case "messages":
        return <MessagesSection />;
      case "stats":
        return <StatsSection />;
      case "users":
        return <UsersSection />;
      case "visits":
        return <VisitsSection />;
      case "reviews":
        return user ? <UserReviewsSection userId={user.id} userName={user.name} /> : null;
      case "settings":
        return <SettingsSection />;
      case "help":
        return <HelpSection />;
      default:
        return <HomeSection onNavigate={setActiveSection} />;
    }
  };

  return (
    <DashboardLayout
      sidebarItems={ownerSidebarItems}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      role="propietario"
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

export default OwnerDashboard;
