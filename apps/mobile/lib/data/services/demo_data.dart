// Mock data for Demo Mode in the mobile app.
//
// Mirrors the web frontend `mockData.ts`. Used by `DemoAuthService`
// when `isDemoMode` is true, so the app can run without a backend.
import '../../core/constants/app_constants.dart';

const _now = '2025-01-15T10:00:00.000Z';

class DemoUser {
  final int id;
  final String name;
  final String email;
  final String role;
  final bool isVerified;
  final String? profilePhotoUrl;
  final String phonePrefix;
  final String phone;
  final String cedulaType;
  final String cedula;
  final String accountStatus;
  final int verificationLevel;

  const DemoUser({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    required this.isVerified,
    this.profilePhotoUrl,
    required this.phonePrefix,
    required this.phone,
    required this.cedulaType,
    required this.cedula,
    this.accountStatus = 'active',
    this.verificationLevel = 2,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'name': name,
        'email': email,
        'role': role,
        'isVerified': isVerified,
        'profilePhotoUrl': profilePhotoUrl,
        'phonePrefix': phonePrefix,
        'phone': phone,
        'cedulaType': cedulaType,
        'cedula': cedula,
        'accountStatus': accountStatus,
        'verificationLevel': verificationLevel,
        'authProvider': 'local',
        'hasPassword': true,
        'tutorialCompleted': true,
        'createdAt': _now,
        'updatedAt': _now,
      };
}

const demoUsers = <DemoUser>[
  DemoUser(
    id: 1,
    name: 'Admin Demo',
    email: 'admin@demo.com',
    role: 'admin',
    isVerified: true,
    phonePrefix: '+57',
    phone: '3001111111',
    cedulaType: 'CC',
    cedula: '1000000001',
  ),
  DemoUser(
    id: 2,
    name: 'Operador Demo',
    email: 'operator@demo.com',
    role: 'operator',
    isVerified: true,
    phonePrefix: '+57',
    phone: '3002222222',
    cedulaType: 'CC',
    cedula: '1000000002',
  ),
  DemoUser(
    id: 3,
    name: 'Propietario Demo',
    email: 'propietario@demo.com',
    role: 'propietario',
    isVerified: true,
    phonePrefix: '+57',
    phone: '3003333333',
    cedulaType: 'CC',
    cedula: '1000000003',
  ),
  DemoUser(
    id: 4,
    name: 'Cliente Demo',
    email: 'cliente@demo.com',
    role: 'cliente',
    isVerified: true,
    phonePrefix: '+57',
    phone: '3004444444',
    cedulaType: 'CC',
    cedula: '1000000004',
  ),
  DemoUser(
    id: 5,
    name: 'Estudiante Demo',
    email: 'estudiante@demo.com',
    role: 'estudiante',
    isVerified: false,
    phonePrefix: '+57',
    phone: '3005555555',
    cedulaType: 'CC',
    cedula: '1000000005',
    verificationLevel: 1,
  ),
];

DemoUser? demoUserByRole(String role) {
  for (final u in demoUsers) {
    if (u.role == role) return u;
  }
  return null;
}

const demoRoles = <String, String>{
  'admin': 'Administrador',
  'operator': 'Operador',
  'propietario': 'Propietario',
  'cliente': 'Cliente',
  'estudiante': 'Estudiante',
};

const demoRoleDescriptions = <String, String>{
  'admin': 'Gestión completa de la plataforma',
  'operator': 'Moderación, verificaciones y soporte',
  'propietario': 'Publica y gestiona tus propiedades',
  'cliente': 'Busca y solicita arrendamientos',
  'estudiante': 'Encuentra tu lugar ideal para estudiar',
};

// ─── Properties ────────────────────────────────────────────────────────────

final demoProperties = <Map<String, dynamic>>[
  {
    'id': 1,
    'title': 'Apartamento moderno en Chapinero',
    'description':
        'Hermoso apartamento de 2 habitaciones en el corazón de Chapinero. '
        'Cerca a universidades, transporte público y zonas comerciales.',
    'type': 'apartamento',
    'status': 'published',
    'price': 1200000,
    'priceType': 'monthly',
    'currency': 'COP',
    'city': 'Bogotá',
    'location': 'Chapinero, Bogotá',
    'latitude': 4.6500,
    'longitude': -74.0600,
    'bedrooms': 2,
    'bathrooms': 1,
    'area': 65,
    'authorId': 3,
    'authorName': 'Propietario Demo',
    'images': [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e1?w=800',
    ],
    'createdAt': _now,
    'updatedAt': _now,
  },
  {
    'id': 2,
    'title': 'Casa amplia en Suba',
    'description':
        'Casa familiar con 3 habitaciones, jardín y garaje. Zona residencial tranquila.',
    'type': 'casa',
    'status': 'published',
    'price': 2500000,
    'priceType': 'monthly',
    'currency': 'COP',
    'city': 'Bogotá',
    'location': 'Suba, Bogotá',
    'latitude': 4.7400,
    'longitude': -74.0900,
    'bedrooms': 3,
    'bathrooms': 2,
    'area': 120,
    'authorId': 3,
    'authorName': 'Propietario Demo',
    'images': [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
    ],
    'createdAt': _now,
    'updatedAt': _now,
  },
  {
    'id': 3,
    'title': 'Cuarto amoblado cerca a la Javeriana',
    'description':
        'Cuarto individual ideal para estudiante. Incluye internet, servicios y acceso a cocina.',
    'type': 'cuarto',
    'status': 'published',
    'price': 450000,
    'priceType': 'monthly',
    'currency': 'COP',
    'city': 'Bogotá',
    'location': 'Centro, Bogotá',
    'latitude': 4.6000,
    'longitude': -74.0700,
    'bedrooms': 1,
    'bathrooms': 1,
    'area': 18,
    'authorId': 3,
    'authorName': 'Propietario Demo',
    'images': [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe8e?w=800',
    ],
    'createdAt': _now,
    'updatedAt': _now,
  },
  {
    'id': 4,
    'title': 'Apartamento con vista en Usaquén',
    'description':
        'Apartamento de lujo con vista a la ciudad. 2 habitaciones, balcón y gimnasio.',
    'type': 'apartamento',
    'status': 'published',
    'price': 3200000,
    'priceType': 'monthly',
    'currency': 'COP',
    'city': 'Bogotá',
    'location': 'Usaquén, Bogotá',
    'latitude': 4.6900,
    'longitude': -74.0300,
    'bedrooms': 2,
    'bathrooms': 2,
    'area': 85,
    'authorId': 3,
    'authorName': 'Propietario Demo',
    'images': [
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
    ],
    'createdAt': _now,
    'updatedAt': _now,
  },
];

// ─── Rental requests ───────────────────────────────────────────────────────

final demoRentalRequests = <Map<String, dynamic>>[
  {
    'id': 1,
    'propertyId': 1,
    'propertyTitle': 'Apartamento moderno en Chapinero',
    'tenantId': 4,
    'tenantName': 'Cliente Demo',
    'ownerId': 3,
    'ownerName': 'Propietario Demo',
    'status': 'pending',
    'message': 'Hola, estoy interesado en visitar el apartamento.',
    'createdAt': _now,
  },
  {
    'id': 2,
    'propertyId': 3,
    'propertyTitle': 'Cuarto amoblado cerca a la Javeriana',
    'tenantId': 5,
    'tenantName': 'Estudiante Demo',
    'ownerId': 3,
    'ownerName': 'Propietario Demo',
    'status': 'approved',
    'message': 'Me gustaría agendar una visita este fin de semana.',
    'createdAt': _now,
  },
];

// ─── Favorites ─────────────────────────────────────────────────────────────

final demoFavorites = <Map<String, dynamic>>[
  {'id': 1, 'userId': 4, 'propertyId': 1, 'createdAt': _now},
  {'id': 2, 'userId': 4, 'propertyId': 4, 'createdAt': _now},
  {'id': 3, 'userId': 5, 'propertyId': 3, 'createdAt': _now},
];

// ─── Admin stats ───────────────────────────────────────────────────────────

const demoAdminStats = <String, dynamic>{
  'totalUsers': 1284,
  'totalProperties': 342,
  'publishedProperties': 287,
  'pendingVerifications': 14,
  'openTickets': 8,
  'monthlyRevenue': 28400000,
};

// ─── Helper ────────────────────────────────────────────────────────────────

/// Simulated network delay for demo responses.
Future<void> mockDelay([int ms = 200]) async {
  await Future.delayed(Duration(milliseconds: ms));
}

/// Whether demo mode is enabled (persisted flag).
bool isDemoModeEnabled() {
  // In-memory flag; persisted via secure storage in DemoAuthService
  return _demoModeEnabled;
}

bool _demoModeEnabled = false;

void setDemoModeEnabled(bool value) {
  _demoModeEnabled = value;
}

/// Role-based dashboard path.
String dashboardPathForRole(String? role) {
  switch (role) {
    case AppConstants.roleAdmin:
      return '/admin';
    case AppConstants.roleOperator:
      return '/operator';
    case AppConstants.roleOwner:
      return '/propietario';
    case AppConstants.roleTenant:
    case AppConstants.roleCliente:
    default:
      return '/estudiante';
  }
}
