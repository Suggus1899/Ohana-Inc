import type { DriveStep } from 'driver.js';
import type { SidebarItemConfig } from './sidebarConfig';

function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 767px)').matches;
}

/** Opens the mobile sidebar Sheet automatically when a mobile step is highlighted */
export function onMobileHighlightStarted(
  _element: Element | undefined,
  step: DriveStep,
): void {
  if (!window.matchMedia('(max-width: 767px)').matches) return;
  const el = step?.element;
  if (typeof el !== 'string') return;
  if (!el.includes('sidebar-mobile-item-')) return;
  const sheetContent = document.querySelector('[data-state="open"]');
  if (!sheetContent) {
    document.querySelector<HTMLElement>('[data-tutorial="sidebar-mobile-trigger"]')?.click();
  }
}

const detailedDescriptions: Record<string, string> = {
  // Cliente / Estudiante
  home: 'Aquí podrás explorar todas las propiedades disponibles para alquiler. Usa los filtros para encontrar la vivienda ideal según tu presupuesto, ubicación y preferencias.',
  favorites: 'Guarda las propiedades que más te gusten haciendo clic en el corazón. Podrás compararlas y acceder rápidamente a ellas sin tener que buscar de nuevo.',
  requests: 'Da seguimiento a todas tus solicitudes de alquiler en un solo lugar. Aquí verás el estado actual de cada solicitud: pendiente, aprobada o rechazada.',
  transactions: 'Gestiona tus pagos y transacciones de forma segura. Podrás realizar pagos P2P directamente a los propietarios y ver el historial completo de tus movimientos.',
  verificacion: 'Completa tu verificación de identidad (KYC) para acceder a todas las funcionalidades de la plataforma. Necesitarás una foto de tu documento de identidad y una selfie.',
  messages: 'Comunícate directamente con los propietarios. Aquí podrás hacer preguntas sobre las propiedades, negociar términos y coordinar visitas.',
  notifications: 'Recibe alertas importantes sobre el estado de tus solicitudes, nuevos mensajes, recordatorios de pago y ofertas especiales.',
  reviews: 'Consulta las reseñas que otros usuarios han dejado sobre ti como inquilino. Tu reputación es clave para que los propietarios confíen en ti.',
  help: 'Encuentra respuestas a preguntas frecuentes, guías de uso y contacta al soporte técnico si necesitas ayuda adicional.',

  // Propietario
  properties: 'Administra todas tus propiedades desde un solo lugar. Puedes publicar nuevas propiedades, editar las existentes, subir fotos y gestionar la disponibilidad.',
  visits: 'Coordina y agenda visitas a tus propiedades. Los estudiantes solicitan visitas y tú confirmas la fecha y hora disponible.',
  stats: 'Analiza el rendimiento de tus propiedades con gráficos y estadísticas. Incluye métricas de visitas, solicitudes recibidas y tasa de conversión.',
  users: 'Consulta la información de los estudiantes y clientes registrados en la plataforma que han interactuado con tus propiedades.',

  // Operador
  tasks: 'Gestiona las tareas que el administrador te ha asignado. Cada tarea incluye instrucciones detalladas y un estado de avance.',
  verifications: 'Revisa y gestiona los usuarios registrados. Puedes verificar identidades, aprobar cuentas y gestionar permisos básicos.',
  support: 'Atiende los tickets de soporte enviados por los usuarios. Resuelve dudas, reporta problemas técnicos y da seguimiento a cada caso.',
  analytics: 'Analiza las tendencias de uso de la plataforma: usuarios activos, propiedades más visitadas y patrones de comportamiento.',
  audit: 'Consulta el registro histórico de acciones realizadas en el sistema para fines de auditoría y control.',
  disputes: 'Gestiona y resuelve disputas entre propietarios e inquilinos relacionadas con transacciones y pagos.',
  statistics: 'Visualiza estadísticas detalladas del sistema: crecimiento de usuarios, propiedades publicadas y transacciones completadas.',
  'human-behavior': 'Herramienta de rastreo visual para analizar el comportamiento de los clientes dentro de la plataforma.',
  'published-properties': 'Supervisa las propiedades publicadas, verifica que cumplan con los requisitos y gestiona su estado.',
  'rental-requests': 'Gestiona las solicitudes de alquiler pendientes y da seguimiento al proceso de asignación.',
  categories: 'Configura y administra las categorías y tipos de propiedades disponibles en la plataforma.',
  kyc: 'Revisa y aprueba las verificaciones de identidad (KYC) enviadas por los usuarios de la plataforma.',
  reports: 'Accede a reportes detallados y análisis de datos sobre el rendimiento general de la plataforma.',
  announcements: 'Publica anuncios y comunicados oficiales que aparecerán para todos los usuarios de la plataforma.',
  operators: 'Administra los operadores del sistema: crea, edita permisos y gestiona sus accesos al panel.',
  'operator_panel': 'Accede al panel de operador para ver el sistema desde la perspectiva de un operador.',
};

const ownerDescriptionOverrides: Record<string, string> = {
  home: 'Aquí podrás ver un resumen de tu actividad: propiedades publicadas, solicitudes recibidas y notificaciones importantes.',
  requests: 'Revisa y gestiona las solicitudes de alquiler que los estudiantes han enviado por tus propiedades. Puedes aprobar o rechazar cada solicitud.',
  transactions: 'Gestiona tus pagos y transacciones de forma segura. Recibirás pagos P2P directamente de los estudiantes y podrás ver el historial completo.',
  messages: 'Comunícate directamente con los estudiantes interesados en tus propiedades. Resuelve sus dudas, negocia términos y coordina visitas.',
  reviews: 'Consulta las reseñas que los inquilinos han dejado sobre tus propiedades. Las reseñas positivas te ayudarán a atraer más estudiantes.',
};

function buildItemSteps(
  sidebarItems: SidebarItemConfig[],
  mobile: boolean,
  getDescription: (item: SidebarItemConfig) => string,
): DriveStep[] {
  if (mobile) {
    return [
      {
        element: '[data-tutorial="sidebar-mobile-trigger"]',
        popover: {
          title: 'Menú de navegación',
          description: 'Este es el menú lateral con todas las secciones de tu panel. Aquí podrás navegar entre cada una de ellas fácilmente.',
          side: 'bottom' as const,
          align: 'center' as const,
        },
      },
      ...sidebarItems.map((item) => ({
        element: `[data-tutorial="sidebar-mobile-item-${item.id}"]` as const,
        popover: {
          title: item.label,
          description: getDescription(item),
          side: 'right' as const,
          align: 'start' as const,
        },
      })),
      {
        element: '#driverjs-no-element',
        popover: {
          title: 'Menú de navegación',
          description: 'Ahora cerraremos el menú para continuar con el resto del tutorial.',
          side: 'bottom' as const,
          align: 'center' as const,
        },
        onHighlightStarted: () => {
          const sheetContent = document.querySelector('[data-state="open"]');
          if (sheetContent) {
            document.querySelector<HTMLElement>('[data-tutorial="sidebar-mobile-trigger"]')?.click();
          }
        },
      },
    ];
  }

  return [
    {
      element: '[data-tutorial="sidebar"]',
      popover: {
        title: 'Panel de navegación',
        description: 'Aquí encontrarás todas las secciones disponibles organizadas en el menú lateral. Cada sección te permitirá gestionar un aspecto específico de tu cuenta.',
        side: 'right' as const,
        align: 'center' as const,
      },
    },
    ...sidebarItems.map((item) => ({
      element: `[data-tutorial="sidebar-item-${item.id}"]` as const,
      popover: {
        title: item.label,
        description: getDescription(item),
        side: 'right' as const,
        align: 'center' as const,
      },
    })),
  ];
}

export function getTutorialSteps(
  userName: string,
  sidebarItems: SidebarItemConfig[],
  role?: string,
): DriveStep[] {
  const mobile = isMobile();
  const descriptions = role === 'propietario' || role === 'owner'
    ? { ...detailedDescriptions, ...ownerDescriptionOverrides }
    : detailedDescriptions;

  const getDescription = (item: SidebarItemConfig): string =>
    descriptions[item.id] || item.description || `Accede a la sección ${item.label}`;

  const steps: DriveStep[] = [
    {
      element: '#driverjs-no-element',
      popover: {
        title: '¡Bienvenido a Ohana!',
        description: `Hola ${userName}, este breve tutorial te guiará por cada sección de tu panel para que conozcas todas las herramientas disponibles.`,
        side: 'center' as const,
        align: 'center' as const,
      },
    },
    ...buildItemSteps(sidebarItems, mobile, getDescription),
    {
      element: '[data-tutorial="user-menu"]',
      popover: {
        title: 'Tu perfil y configuración',
        description: 'Desde este menú puedes acceder a tu perfil, ajustar la configuración de tu cuenta, cambiar tu contraseña y cerrar sesión cuando lo necesites.',
        side: 'left' as const,
        align: 'center' as const,
      },
    },
    {
      element: '#driverjs-no-element',
      popover: {
        title: '¡Ya estás listo!',
        description: `Ahora conoces todas las secciones disponibles. Explora cada una y saca el máximo provecho de Ohana. ¡Mucho éxito, ${userName}!`,
        side: 'center' as const,
        align: 'center' as const,
      },
    },
  ];

  return steps;
}
