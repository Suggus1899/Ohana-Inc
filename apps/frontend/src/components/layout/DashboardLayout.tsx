import { useState, ReactNode, useMemo, memo } from "react";
import Navbar from "./Navbar";
import Sidebar, { SidebarItem, UserRole } from "./Sidebar";
import { cn } from "@/lib/utils";
import { 
  getTitleByRole, 
  getPermissionsByRole, 
  RolePermissions 
} from "@/config/sidebarConfig";
import { useSidebarBadges } from "@/hooks/useSidebarBadges";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles } from "lucide-react";

export type { UserRole };

interface DashboardLayoutProps {
  children: ReactNode;
  sidebarItems: SidebarItem[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  title?: string;
  role?: UserRole;
  sidebarBadges?: Record<string, number>;
}

const DashboardLayout = ({
  children,
  sidebarItems,
  activeSection,
  onSectionChange,
  title,
  role = "client",
  sidebarBadges: propSidebarBadges,
}: DashboardLayoutProps) => {
  const { isDemoMode } = useAuth();
  const dashboardTitle = title || getTitleByRole(role);
  const _permissions: RolePermissions = getPermissionsByRole(role);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Get real-time badges using hook
  const hookSidebarBadges = useSidebarBadges(role);

  // Memoize combination of hook badges and prop overrides
  const itemsWithBadges = useMemo(() => {
    const activeBadges = {
      ...hookSidebarBadges,
      ...propSidebarBadges,
    };
    return sidebarItems.map(item => ({
      ...item,
      badge: activeBadges[item.id] !== undefined ? activeBadges[item.id] : item.badge
    }));
  }, [sidebarItems, hookSidebarBadges, propSidebarBadges]);

  return (
    <div className="h-screen bg-background overflow-hidden">
      <Navbar 
        variant="dashboard" 
        dashboardItems={itemsWithBadges}
        activeSection={activeSection}
        onSectionChange={onSectionChange}
      />

      <div className="flex h-[calc(100vh-3.5rem)]">
        <Sidebar
          items={itemsWithBadges}
          activeItem={activeSection}
          onItemClick={onSectionChange}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={dashboardTitle}
          role={role}
        />

        <main data-tutorial="main-content"
          className={cn(
            "flex-1 overflow-auto scrollbar-hide transition-all duration-300",
            "p-6 md:p-8"
          )}
        >
          {isDemoMode && (
            <div className="flex items-center gap-2 p-2.5 mb-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
              <Sparkles className="h-4 w-4 shrink-0" />
              <p className="text-xs font-medium">
                Modo demo — estas viendo datos de demostracion. Ningun cambio se guarda.
                Cierra sesion para volver al modo normal.
              </p>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
};

export default memo(DashboardLayout);
