import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../data/services/api_client.dart';
import '../../presentation/pages/pages.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      final isLoggedIn = authState.status == AuthStatus.authenticated;
      final isAuthRoute = state.matchedLocation == '/login' ||
          state.matchedLocation == '/registro' ||
          state.matchedLocation == '/recuperar-password' ||
          state.matchedLocation == '/verificar-email' ||
          state.matchedLocation == '/auth/callback' ||
          state.matchedLocation == '/auth/google-setup';

      // If not logged in and trying to access protected route -> login
      if (!isLoggedIn && !isAuthRoute && _isProtectedRoute(state.matchedLocation)) {
        return '/login';
      }

      // If logged in and on auth route -> dashboard
      if (isLoggedIn && isAuthRoute) {
        final role = authState.user?['role'] as String?;
        return _dashboardPathForRole(role);
      }

      return null;
    },
    routes: [
      // ── Public ────────────────────────────────────────────────
      GoRoute(
        path: '/',
        builder: (context, state) => const LandingPage(),
      ),
      GoRoute(
        path: '/propiedades/:id',
        builder: (context, state) => PropertyDetailPage(
          propertyId: int.parse(state.pathParameters['id']!),
        ),
      ),
      GoRoute(
        path: '/perfil/:userId',
        builder: (context, state) => PublicProfilePage(
          userId: int.parse(state.pathParameters['userId']!),
        ),
      ),
      GoRoute(
        path: '/terminos',
        builder: (context, state) => const TermsPage(),
      ),
      GoRoute(
        path: '/politicas',
        builder: (context, state) => const PrivacyPage(),
      ),

      // ── Auth ──────────────────────────────────────────────────
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginPage(),
      ),
      GoRoute(
        path: '/registro',
        builder: (context, state) => const RegisterPage(),
      ),
      GoRoute(
        path: '/recuperar-password',
        builder: (context, state) => const ForgotPasswordPage(),
      ),
      GoRoute(
        path: '/verificar-email',
        builder: (context, state) => const VerifyEmailPage(),
      ),
      GoRoute(
        path: '/auth/callback',
        builder: (context, state) => const AuthCallbackPage(),
      ),
      GoRoute(
        path: '/auth/google-setup',
        builder: (context, state) => const GoogleSetupPage(),
      ),

      // ── Protected ─────────────────────────────────────────────
      GoRoute(
        path: '/admin',
        builder: (context, state) => const AdminDashboardPage(),
      ),
      GoRoute(
        path: '/propietario',
        builder: (context, state) => const OwnerDashboardPage(),
      ),
      GoRoute(
        path: '/operator',
        builder: (context, state) => const OperatorDashboardPage(),
      ),
      GoRoute(
        path: '/estudiante',
        builder: (context, state) => const TenantDashboardPage(),
      ),
      GoRoute(
        path: '/cliente',
        builder: (context, state) => const TenantDashboardPage(),
      ),
      GoRoute(
        path: '/perfil',
        builder: (context, state) => const ProfilePage(),
      ),
      GoRoute(
        path: '/navigation/:propertyId',
        builder: (context, state) => NavigationPage(
          propertyId: int.parse(state.pathParameters['propertyId']!),
        ),
      ),
    ],
    errorBuilder: (context, state) => const NotFoundPage(),
  );
});

bool _isProtectedRoute(String path) {
  return path == '/admin' ||
      path == '/propietario' ||
      path == '/operator' ||
      path == '/estudiante' ||
      path == '/cliente' ||
      path == '/perfil' ||
      path.startsWith('/navigation/');
}

String _dashboardPathForRole(String? role) {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'operator':
      return '/operator';
    case 'propietario':
      return '/propietario';
    case 'estudiante':
    case 'cliente':
    default:
      return '/estudiante';
  }
}
