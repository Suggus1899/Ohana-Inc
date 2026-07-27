import {
  Home,
  Heart,
  FileText,
  MessageSquare,
  Building,
  Inbox,
  BarChart3,
  Users,
  FileBarChart,
  ShieldCheck,
  Bell,
  HelpCircle,
  ClipboardList,
  UserCog,
  Database,
  Megaphone,
  Eye,
  ArrowLeftRight,
  History,
  Activity,
  DollarSign,
  Calendar,
  Star,
  LucideIcon,
} from "lucide-react";

export interface SidebarItemConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  description?: string;
}

// ============================================
// CLIENTE/ESTUDIANTE - Solo consume información
// ============================================
export const clientSidebarItems: SidebarItemConfig[] = [
  {
    id: "home",
    label: "Inicio",
    icon: Home,
    description: "Explorar propiedades disponibles"
  },
  {
    id: "favorites",
    label: "Mis Favoritos",
    icon: Heart,
    description: "Propiedades guardadas"
  },
  {
    id: "requests",
    label: "Mis Solicitudes",
    icon: FileText,
    description: "Estado de tus solicitudes"
  },
  {
    id: "transactions",
    label: "Transacciones",
    icon: ArrowLeftRight,
    description: "Pagos y transacciones P2P"
  },
  {
    id: "verificacion",
    label: "Verificación KYC",
    icon: ShieldCheck,
    description: "Verificar tu identidad"
  },
  {
    id: "messages",
    label: "Mensajes",
    icon: MessageSquare,
    badge: 3,
    description: "Comunicación con propietarios"
  },
  {
    id: "notifications",
    label: "Notificaciones",
    icon: Bell,
    badge: 5,
    description: "Alertas y avisos"
  },
  {
    id: "reviews",
    label: "Mis Reseñas",
    icon: Star,
    description: "Reseñas que han hecho sobre ti"
  },
  {
    id: "help",
    label: "Ayuda",
    icon: HelpCircle,
    description: "Soporte y preguntas frecuentes"
  },
];

// ============================================
// OPERADOR - Tareas delegadas por admin
// ============================================
export const operatorSidebarItems: SidebarItemConfig[] = [
  {
    id: "home",
    label: "Panel de Tareas",
    icon: Home,
    description: "Tareas asignadas y pendientes"
  },
  {
    id: "tasks",
    label: "Mis Tareas",
    icon: ClipboardList,
    badge: 0,
    description: "Tareas asignadas por el admin"
  },
  {
    id: "verifications",
    label: "Usuarios",
    icon: Users,
    badge: 0,
    description: "Gestionar usuarios y verificaciones"
  },
  {
    id: "reviews",
    label: "Revisión de Contenido",
    icon: Eye,
    description: "Revisar publicaciones pendientes"
  },
  {
    id: "support",
    label: "Soporte al Cliente",
    icon: MessageSquare,
    badge: 0,
    description: "Tickets y reportes de usuarios"
  },
  { 
    id: "analytics", 
    label: "Analíticas de Uso", 
    icon: BarChart3,
    description: "Comportamiento y tendencias"
  },
  { 
    id: "audit", 
    label: "Auditoría y Logs", 
    icon: History,
    description: "Historial de acciones del sistema"
  },
  {
    id: "disputes",
    label: "Disputas",
    icon: ArrowLeftRight,
    description: "Gestionar disputas de transacciones"
  },
  {
    id: "statistics",
    label: "Estadísticas",
    icon: BarChart3,
    description: "Análisis y métricas del sistema"
  },
  {
    id: "human-behavior",
    label: "Comportamiento Humano",
    icon: Activity,
    description: "Rastreo visual del comportamiento de clientes"
  },
  {
    id: "published-properties",
    label: "Prop. Publicadas",
    icon: Building,
    description: "Gestionar propiedades activas"
  },
  {
    id: "rental-requests",
    label: "Solicitudes",
    icon: FileText,
    description: "Solicitudes de alquiler"
  },
  {
    id: "transactions",
    label: "Transacciones",
    icon: DollarSign,
    description: "Pagos y transacciones"
  },
  {
    id: "messages",
    label: "Mensajes",
    icon: MessageSquare,
    description: "Comunicación interna"
  },
];

// ============================================
// PROPIETARIO - Gestiona sus propiedades
// ============================================
export const ownerSidebarItems: SidebarItemConfig[] = [
  {
    id: "home",
    label: "Inicio",
    icon: Home,
    description: "Resumen de tu actividad"
  },
  {
    id: "properties",
    label: "Mis Propiedades",
    icon: Building,
    description: "Gestionar tus propiedades"
  },
  {
    id: "requests",
    label: "Solicitudes Recibidas",
    icon: Inbox,
    description: "Solicitudes de estudiantes"
  },
  {
    id: "visits",
    label: "Visitas Agendadas",
    icon: Calendar,
    description: "Visitas solicitadas a tus propiedades"
  },
  {
    id: "transactions",
    label: "Transacciones",
    icon: ArrowLeftRight,
    description: "Pagos y transacciones P2P"
  },
  {
    id: "verificacion",
    label: "Verificación KYC",
    icon: ShieldCheck,
    description: "Verificar tu identidad"
  },
  {
    id: "messages",
    label: "Mensajes",
    icon: MessageSquare,
    badge: 2,
    description: "Comunicación con estudiantes"
  },
  {
    id: "stats",
    label: "Estadísticas",
    icon: BarChart3,
    description: "Rendimiento de tus propiedades"
  },
  {
    id: "users",
    label: "Usuarios",
    icon: Users,
    description: "Estudiantes y clientes registrados"
  },
  {
    id: "reviews",
    label: "Mis Reseñas",
    icon: Star,
    description: "Reseñas que han hecho sobre ti y tus propiedades"
  },
  {
    id: "help",
    label: "Ayuda",
    icon: HelpCircle,
    description: "Soporte y preguntas frecuentes"
  },
];

// ============================================
// ADMINISTRADOR - CRUD completo
// ============================================
export const adminSidebarItems: SidebarItemConfig[] = [
  {
    id: "home",
    label: "Dashboard",
    icon: Home,
    description: "Resumen ejecutivo de la plataforma"
  },
  {
    id: "users",
    label: "Gestión de Usuarios",
    icon: Users,
    description: "CRUD completo de usuarios"
  },
  {
    id: "operators",
    label: "Gestión de Operadores",
    icon: UserCog,
    description: "Administrar operadores y permisos"
  },
  {
    id: "properties",
    label: "Gestión de Propiedades",
    icon: Building,
    description: "CRUD completo de propiedades"
  },
  {
    id: "categories",
    label: "Categorías y Tipos",
    icon: Database,
    description: "Configurar tipos de propiedades"
  },
  {
    id: "support",
    label: "Soporte al Cliente",
    icon: MessageSquare,
    badge: 0,
    description: "Tickets de soporte e historial"
  },
  {
    id: "kyc",
    label: "Verificaciones KYC",
    icon: ShieldCheck,
    badge: 0,
    description: "Aprobar verificaciones de identidad"
  },
  {
    id: "reports",
    label: "Reportes y Analytics",
    icon: FileBarChart,
    description: "Estadísticas de la plataforma"
  },
  {
    id: "announcements",
    label: "Anuncios",
    icon: Megaphone,
    badge: 0,
    description: "Publicar anuncios del sistema"
  },
  {
    id: "audit",
    label: "Auditoria y Logs",
    icon: History,
    description: "Historial de acciones del sistema"
  },
  {
    id: "operator_panel",
    label: "Panel Operador",
    icon: UserCog,
    description: "Acceder al panel de operador",
    href: "/operator",
  },
  {
    id: "published-properties",
    label: "Prop. Publicadas",
    icon: Building,
    description: "Gestionar propiedades activas"
  },
  {
    id: "rental-requests",
    label: "Solicitudes",
    icon: FileText,
    description: "Solicitudes de alquiler"
  },
  {
    id: "transactions",
    label: "Transacciones",
    icon: DollarSign,
    description: "Pagos y transacciones"
  },
  {
    id: "messages",
    label: "Mensajes",
    icon: MessageSquare,
    description: "Comunicación interna"
  },
];

// Helper to get sidebar items by role
export const getSidebarItemsByRole = (role: string): SidebarItemConfig[] => {
  switch (role) {
    case "admin":
      return adminSidebarItems;
    case "operator":
      return operatorSidebarItems;
    case "owner":
    case "propietario":
      return ownerSidebarItems;
    case "cliente":
    case "client":
    case "tenant":
    case "estudiante":
    default:
      return clientSidebarItems;
  }
};

// ============================================
// SISTEMA DE PERMISOS POR ROL
// ============================================

export interface RolePermissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canAssignTasks: boolean;
}

// Cliente: Solo puede ver información e interactuar (favoritos, solicitudes, mensajes)
export const clientPermissions: RolePermissions = {
  canView: true,
  canCreate: false,
  canEdit: false,
  canDelete: false,
  canApprove: false,
  canAssignTasks: false,
};

// Operador: Puede ver, editar contenido asignado y aprobar, pero NO crear ni eliminar
export const operatorPermissions: RolePermissions = {
  canView: true,
  canCreate: false,
  canEdit: true, // Solo editar lo asignado
  canDelete: false,
  canApprove: true, // Aprobar/rechazar contenido
  canAssignTasks: false,
};

// Propietario: Puede crear, editar y eliminar sus propias propiedades
export const ownerPermissions: RolePermissions = {
  canView: true,
  canCreate: true, // Crear propiedades
  canEdit: true, // Editar sus propiedades
  canDelete: true, // Eliminar sus propiedades
  canApprove: false,
  canAssignTasks: false,
};

// Admin: CRUD completo en todo el sistema
export const adminPermissions: RolePermissions = {
  canView: true,
  canCreate: true,
  canEdit: true,
  canDelete: true,
  canApprove: true,
  canAssignTasks: true,
};

// Helper para obtener permisos por rol
export const getPermissionsByRole = (role: string): RolePermissions => {
  switch (role) {
    case "admin":
      return adminPermissions;
    case "operator":
      return operatorPermissions;
    case "owner":
    case "propietario":
      return ownerPermissions;
    case "cliente":
    case "client":
    case "tenant":
    case "estudiante":
    default:
      return clientPermissions;
  }
};

// Mantener compatibilidad con estructura anterior
export const rolePermissions = {
  cliente: clientPermissions,
  estudiante: clientPermissions,
  propietario: ownerPermissions,
  operator: operatorPermissions,
  admin: adminPermissions,
};

// ============================================
// TÍTULOS POR ROL (mismo color para todos)
// ============================================

export const roleTitles: Record<string, string> = {
  cliente: "Panel Cliente",
  client: "Panel Cliente",
  tenant: "Panel Cliente",
  estudiante: "Panel Estudiante",
  operator: "Panel Operador",
  owner: "Panel Propietario",
  propietario: "Panel Propietario",
  admin: "Panel Administrador",
};

export const getTitleByRole = (role: string): string => {
  return roleTitles[role] || "Panel";
};
