import { Home, Users, Building, TrendingUp, Eye, MessageSquare, LucideIcon } from "lucide-react";

// Mock Properties
export interface MockProperty {
  id: string;
  title: string;
  location: string;
  price: string;
  status: "active" | "pending" | "inactive";
  views: number;
  type: string;
  bedrooms: number;
  image?: string;
}

export const mockProperties: MockProperty[] = [
  {
    id: "1",
    title: "Apartamento Moderno Centro",
    location: "Centro, San Juan de los Morros",
    price: "Bs. 250",
    status: "active",
    views: 145,
    type: "Apartamento",
    bedrooms: 2,
  },
  {
    id: "2",
    title: "Casa con Jardín Amplio",
    location: "Urbanización Las Palmas",
    price: "Bs. 400",
    status: "active",
    views: 89,
    type: "Casa",
    bedrooms: 3,
  },
  {
    id: "4",
    title: "Apartamento Familiar",
    location: "Zona Norte",
    price: "Bs. 320",
    status: "inactive",
    views: 23,
    type: "Apartamento",
    bedrooms: 3,
  },
];

// Mock Requests
export interface MockRequest {
  id: string;
  propertyTitle: string;
  requesterName: string;
  requesterEmail: string;
  date: string;
  status: "pending" | "approved" | "rejected";
  message?: string;
}

export const mockRequests: MockRequest[] = [
  {
    id: "1",
    propertyTitle: "Apartamento Moderno Centro",
    requesterName: "María García",
    requesterEmail: "maria@email.com",
    date: "2024-12-08",
    status: "pending",
    message: "Estoy interesada en visitar el apartamento este fin de semana.",
  },
  {
    id: "2",
    propertyTitle: "Casa con Jardín Amplio",
    requesterName: "Carlos Rodríguez",
    requesterEmail: "carlos@email.com",
    date: "2024-12-07",
    status: "approved",
    message: "Me gustaría conocer más detalles sobre el contrato.",
  },
  {
    id: "3",
    propertyTitle: "Habitación Amueblada",
    requesterName: "Ana Martínez",
    requesterEmail: "ana@email.com",
    date: "2024-12-06",
    status: "rejected",
    message: "¿Está disponible para mudanza inmediata?",
  },
  {
    id: "4",
    propertyTitle: "Apartamento Familiar",
    requesterName: "Pedro López",
    requesterEmail: "pedro@email.com",
    date: "2024-12-05",
    status: "pending",
    message: "Somos una familia de 4 personas, ¿acepta mascotas?",
  },
];

// Mock Messages
export interface MockMessage {
  id: string;
  senderName: string;
  senderAvatar?: string;
  preview: string;
  date: string;
  unread: boolean;
  propertyTitle?: string;
}

export const mockMessages: MockMessage[] = [
  {
    id: "1",
    senderName: "María García",
    preview: "Hola, ¿el apartamento sigue disponible?",
    date: "2024-12-10 14:30",
    unread: true,
    propertyTitle: "Apartamento Moderno Centro",
  },
  {
    id: "2",
    senderName: "Carlos Rodríguez",
    preview: "Gracias por la información, me interesa agendar una visita.",
    date: "2024-12-10 10:15",
    unread: true,
    propertyTitle: "Casa con Jardín Amplio",
  },
  {
    id: "3",
    senderName: "Ana Martínez",
    preview: "¿Cuál es el depósito requerido?",
    date: "2024-12-09 18:45",
    unread: false,
    propertyTitle: "Habitación Amueblada",
  },
  {
    id: "4",
    senderName: "Soporte Habitas",
    preview: "Tu cuenta ha sido verificada exitosamente.",
    date: "2024-12-08 09:00",
    unread: false,
  },
];

// Mock Statistics
export interface MockStat {
  label: string;
  value: number;
  change?: number;
  icon: LucideIcon;
  prefix?: string;
  suffix?: string;
}

export const mockOwnerStats: MockStat[] = [
  { label: "Propiedades Activas", value: 4, change: 2, icon: Building },
  { label: "Vistas Totales", value: 313, change: 15, icon: Eye },
  { label: "Solicitudes Pendientes", value: 2, change: -1, icon: TrendingUp },
  { label: "Mensajes Sin Leer", value: 5, icon: MessageSquare },
];

export const mockTenantStats: MockStat[] = [
  { label: "Propiedades Favoritas", value: 8, icon: Home },
  { label: "Solicitudes Enviadas", value: 3, icon: TrendingUp },
  { label: "Mensajes Sin Leer", value: 2, icon: MessageSquare },
];

export const mockAdminStats: MockStat[] = [
  { label: "Total Usuarios", value: 1250, change: 45, icon: Users },
  { label: "Propiedades Publicadas", value: 342, change: 12, icon: Building },
  { label: "Verificaciones Pendientes", value: 8, icon: TrendingUp },
  { label: "Reportes Activos", value: 3, icon: MessageSquare },
];

// Mock Users (for admin)
export interface MockUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "propietario" | "cliente" | "operator";
  isVerified: boolean;
  accountStatus: "pending" | "active" | "suspended" | "rejected";
  createdAt: string;
  propertiesCount?: number;
}

export const mockUsers: MockUser[] = [
  {
    id: 1,
    name: "Juan Pérez",
    email: "juan@email.com",
    role: "propietario",
    isVerified: true,
    accountStatus: "active",
    createdAt: "2024-10-15",
    propertiesCount: 3,
  },
  {
    id: 2,
    name: "María García",
    email: "maria@email.com",
    role: "cliente",
    isVerified: true,
    accountStatus: "active",
    createdAt: "2024-11-20",
  },
  {
    id: 3,
    name: "Carlos Rodríguez",
    email: "carlos@email.com",
    role: "propietario",
    isVerified: false,
    accountStatus: "pending",
    createdAt: "2024-12-01",
    propertiesCount: 1,
  },
  {
    id: 4,
    name: "Ana Martínez",
    email: "ana@email.com",
    role: "cliente",
    isVerified: true,
    accountStatus: "active",
    createdAt: "2024-12-05",
  },
];

// Mock KYC Verifications
export interface MockKYC {
  id: string;
  userName: string;
  userEmail: string;
  documentType: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
}

export const mockKYCVerifications: MockKYC[] = [
  {
    id: "1",
    userName: "Carlos Rodríguez",
    userEmail: "carlos@email.com",
    documentType: "Cédula de Identidad",
    submittedAt: "2024-12-09",
    status: "pending",
  },
  {
    id: "2",
    userName: "Laura Sánchez",
    userEmail: "laura@email.com",
    documentType: "Pasaporte",
    submittedAt: "2024-12-08",
    status: "pending",
  },
  {
    id: "3",
    userName: "Pedro López",
    userEmail: "pedro@email.com",
    documentType: "Cédula de Identidad",
    submittedAt: "2024-12-07",
    status: "approved",
  },
];

// Mock Favorites (for tenant)
export interface MockFavorite {
  id: string;
  propertyId: string;
  title: string;
  location: string;
  price: string;
  type: string;
  bedrooms: number;
  addedAt: string;
}

export const mockFavorites: MockFavorite[] = [
  {
    id: "1",
    propertyId: "1",
    title: "Apartamento Moderno Centro",
    location: "Centro, San Juan de los Morros",
    price: "Bs. 250",
    type: "Apartamento",
    bedrooms: 2,
    addedAt: "2024-12-08",
  },
  {
    id: "2",
    propertyId: "2",
    title: "Casa con Jardín Amplio",
    location: "Urbanización Las Palmas",
    price: "Bs. 400",
    type: "Casa",
    bedrooms: 3,
    addedAt: "2024-12-06",
  },
  {
    id: "3",
    propertyId: "5",
    title: "Estudio Céntrico",
    location: "Av. Principal",
    price: "Bs. 180",
    type: "Estudio",
    bedrooms: 1,
    addedAt: "2024-12-04",
  },
];
