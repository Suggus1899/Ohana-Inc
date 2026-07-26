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
  const dashboardTitle = title || getTitleByRole(role);
  const permissions: RolePermissions = getPermissionsByRole(role);
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
          {children}
        </main>
      </div>
    </div>
  );
};

export default memo(DashboardLayout);
