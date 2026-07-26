import { useState, useEffect, lazy, Suspense, useMemo } from "react";
import DashboardLayout, { UserRole } from "@/components/layout/DashboardLayout";
import { operatorSidebarItems } from "@/config/sidebarConfig";
import { api, ModerationStats } from "@/services/api";

// Operator sections (lazy loaded)
const HomeSection = lazy(() => import("@/components/dashboard/operator/HomeSection"));
const TasksSection = lazy(() => import("@/components/dashboard/operator/TasksSection"));
const VerificationsSection = lazy(() => import("@/components/dashboard/operator/VerificationsSection"));
const ContentReviewSection = lazy(() => import("@/components/dashboard/operator/ContentReviewSection"));
const SupportSection = lazy(() => import("@/components/dashboard/operator/SupportSection"));
const StatisticsSection = lazy(() => import("@/components/dashboard/operator/StatisticsSection"));
const UserReportsSection = lazy(() => import("@/components/dashboard/operator/UserReportsSection"));
const AnalyticsDetailsSection = lazy(() => import("@/components/dashboard/operator/AnalyticsDetailsSection"));
const AuditSection = lazy(() => import("@/components/dashboard/operator/AuditSection"));
const HumanBehaviorSection = lazy(() => import("@/components/dashboard/operator/HumanBehaviorSection"));
const PublishedPropertiesSection = lazy(() => import("@/components/dashboard/operator/PublishedPropertiesSection"));
const RentalRequestsSection = lazy(() => import("@/components/dashboard/operator/RentalRequestsSection"));
const SettingsSection = lazy(() => import("@/components/dashboard/shared/SettingsSection"));
const DisputePanel = lazy(() => import("@/components/disputes/DisputePanel"));
const TransactionPanel = lazy(() => import("@/components/transactions/TransactionPanel"));
const TransactionsSection = lazy(() => import("@/components/dashboard/operator/TransactionsSection"));
const MessagesSection = lazy(() => import("@/components/dashboard/shared/MessagesSection"));

const PlaceholderSection = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
    <p className="text-muted-foreground">Sección "{title}" en desarrollo</p>
  </div>
);

const OperatorDashboard = () => {
  const [activeSection, setActiveSection] = useState("home");
  const [stats, setStats] = useState<ModerationStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const response = await api.getModerationStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    };
    fetchStats();
    // Poll stats every 10 seconds to keep sidebar up to date
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const renderSection = () => {
    switch (activeSection) {
      case "home": return <HomeSection onNavigate={setActiveSection} />;
      case "tasks": return <TasksSection />;
      case "verifications": return <VerificationsSection />;
      case "reviews": return <ContentReviewSection />;
      case "support": return <SupportSection />;
      case "reports": return <UserReportsSection />;
      case "analytics": return <AnalyticsDetailsSection />;
      case "audit": return <AuditSection />;
      case "properties-review": return <ContentReviewSection />;
      case "disputes": return <DisputePanel />;
      case "statistics": return <StatisticsSection />;
      case "human-behavior": return <HumanBehaviorSection />;
      case "published-properties": return <PublishedPropertiesSection />;
      case "rental-requests": return <RentalRequestsSection />;
      case "transactions": return <TransactionsSection />;
      case "messages": return <MessagesSection />;
      case "settings": return <SettingsSection />;
      default: return <HomeSection />;
    }
  };

  const badges = useMemo(() => stats ? {
    "verifications": stats.pending.verifications,
    "reviews": stats.pending.properties,
    "properties-review": stats.pending.properties,
    "support": (stats.pending.tickets || 0) + (stats.pending.reports || 0),
    "tasks": stats.pending.tasks
  } : {}, [stats]);

  return (
    <DashboardLayout
      sidebarItems={operatorSidebarItems}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      role="operator"
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

export default OperatorDashboard;
