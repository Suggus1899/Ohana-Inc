import { useState, useEffect, lazy, Suspense } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { adminSidebarItems } from "@/config/sidebarConfig";
import { api } from "@/services/api";
import { connectSocket, getSocket } from "@/services/socket";

// Admin sections - CRUD completo en todas las secciones (lazy loaded)
const HomeSection = lazy(() => import("@/components/dashboard/admin/HomeSection"));
const UsersSection = lazy(() => import("@/components/dashboard/admin/UsersSection"));
const OperatorsSection = lazy(() => import("@/components/dashboard/admin/OperatorsSection"));
const PropertiesSection = lazy(() => import("@/components/dashboard/admin/PropertiesSection"));
const ReportsSection = lazy(() => import("@/components/dashboard/admin/ReportsSection"));
const KYCSection = lazy(() => import("@/components/dashboard/admin/KYCSection"));
const AnnouncementsSection = lazy(() => import("@/components/dashboard/admin/AnnouncementsSection"));
const SettingsSection = lazy(() => import("@/components/dashboard/shared/SettingsSection"));
const AdminSettingsSection = lazy(() => import("@/components/dashboard/admin/AdminSettingsSection"));
const CategoriesSection = lazy(() => import("@/components/dashboard/admin/CategoriesSection"));
const EscalatedTicketsSection = lazy(() => import("@/components/dashboard/admin/EscalatedTicketsSection"));
const AdminSupportSection = lazy(() => import("@/components/dashboard/admin/AdminSupportSection"));
const AuditSection = lazy(() => import("@/components/dashboard/operator/AuditSection"));
const MessagesSection = lazy(() => import("@/components/dashboard/shared/MessagesSection"));

// Placeholder sections
const PlaceholderSection = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
    <p className="text-muted-foreground">Sección "{title}" en desarrollo</p>
  </div>
);

// Panel Administrador: CRUD completo en todo el sistema
const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState("home");
  const [badges, setBadges] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const [statsRes, annRes] = await Promise.all([
          api.getModerationStats(),
          api.getAnnouncements({ status: 'draft', limit: 1 }),
        ]);
        setBadges({
          kyc: statsRes.success && statsRes.data ? statsRes.data.pending.verifications : 0,
          support: statsRes.success && statsRes.data ? statsRes.data.pending.tickets : 0,
          announcements: annRes.success && annRes.data ? (annRes.data as any).total : 0,
        });
      } catch { /* silent */ }
    };

    fetchBadges();
    const interval = setInterval(fetchBadges, 30000);

    // Websocket: actualizar badges en tiempo real
    const socket = connectSocket();
    socket.on('ticket_created', fetchBadges);
    socket.on('ticket_updated', fetchBadges);
    socket.on('announcement_updated', fetchBadges);
    socket.on('badge_update', fetchBadges);

    return () => {
      clearInterval(interval);
      const s = getSocket();
      if (s) {
        s.off('ticket_created', fetchBadges);
        s.off('ticket_updated', fetchBadges);
        s.off('announcement_updated', fetchBadges);
        s.off('badge_update', fetchBadges);
      }
    };
  }, []);

  const renderSection = () => {
    switch (activeSection) {
      case "home":
        return <HomeSection />;
      case "users":
        return <UsersSection />;
      case "operators":
        return <OperatorsSection />;
      case "properties":
        return <PropertiesSection />;
      case "categories":
        return <CategoriesSection />;
      case "escalated":
        return <EscalatedTicketsSection />;
      case "support":
        return <AdminSupportSection />;
      case "kyc":
        return <KYCSection />
      case "reports":
        return <ReportsSection />;
      case "announcements":
        return <AnnouncementsSection />;
      case "settings":
        return <AdminSettingsSection />;
      case "audit":
        return <AuditSection />;
      case "messages":
        return <MessagesSection />;
      default:
        return <HomeSection />;
    }
  };

  return (
    <DashboardLayout
      sidebarItems={adminSidebarItems}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      role="admin"
      sidebarBadges={badges}
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

export default AdminDashboard;
