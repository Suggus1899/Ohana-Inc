// Demo mode service that intercepts API calls with mock data.
//
// When `isDemoModeEnabled()` is true, the app uses this service instead
// of making real HTTP requests. Mirrors the web frontend `mockApi.ts`.
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'demo_data.dart';

/// Wraps an [ApiClient] and intercepts its methods when demo mode is on.
class DemoApiClient {
  DemoApiClient(this._ref);

  final Ref _ref;

  DemoUser get _currentUser {
    final role = _ref.read(demoRoleProvider) ?? 'cliente';
    return demoUserByRole(role) ?? demoUsers[3];
  }

  // ── Auth ─────────────────────────────────────────────────────

  Future<Response> login(String email, String password) async {
    await mockDelay();
    final user = demoUsers.firstWhere(
      (u) => u.email == email,
      orElse: () => demoUsers[3],
    );
    return _ok({'token': 'demo-token', 'user': user.toMap()});
  }

  Future<Response> getMe() async {
    await mockDelay();
    return _ok({'data': _currentUser.toMap(), 'user': _currentUser.toMap()});
  }

  Future<Response> register(Map<String, dynamic> data) async {
    await mockDelay();
    return _ok({'message': 'Registro exitoso (demo). Verifica tu correo.'});
  }

  Future<Response> forgotPassword(String email) async {
    await mockDelay();
    return _ok({'message': 'Correo de recuperación enviado (demo).'});
  }

  Future<Response> verifyEmail(String token) async {
    await mockDelay();
    return _ok({'token': 'demo-token', 'user': _currentUser.toMap()});
  }

  // ── Properties ───────────────────────────────────────────────

  Future<Response> getProperties({
    int page = 1,
    int limit = 20,
    String? search,
  }) async {
    await mockDelay();
    var list = [...demoProperties];
    if (search != null && search.isNotEmpty) {
      final q = search.toLowerCase();
      list = list
          .where((p) =>
              (p['title'] as String).toLowerCase().contains(q) ||
              (p['location'] as String).toLowerCase().contains(q))
          .toList();
    }
    return _ok({
      'data': list,
      'properties': list,
      'pagination': {
        'page': page,
        'limit': limit,
        'total': list.length,
        'pages': 1,
      },
    });
  }

  Future<Response> getProperty(int id) async {
    await mockDelay();
    final p = demoProperties.firstWhere(
      (e) => e['id'] == id,
      orElse: () => demoProperties[0],
    );
    return _ok({'data': p, 'property': p});
  }

  Future<Response> createProperty(Map<String, dynamic> data) async {
    await mockDelay();
    return _ok({'property': {...data, 'id': 999, 'authorId': _currentUser.id}});
  }

  Future<Response> updateProperty(int id, Map<String, dynamic> data) async {
    await mockDelay();
    return _ok({'property': {...data, 'id': id}});
  }

  Future<Response> deleteProperty(int id) async {
    await mockDelay();
    return _ok({'message': 'Propiedad eliminada (demo)'});
  }

  // ── Favorites ────────────────────────────────────────────────

  Future<Response> getFavorites() async {
    await mockDelay();
    final list = demoFavorites
        .where((f) => f['userId'] == _currentUser.id)
        .map((f) => {
              ...f,
              'property': demoProperties.firstWhere(
                (p) => p['id'] == f['propertyId'],
                orElse: () => demoProperties[0],
              )
            })
        .toList();
    return _ok({'data': list, 'favorites': list});
  }

  Future<Response> toggleFavorite(int propertyId) async {
    await mockDelay();
    final exists = demoFavorites.any(
      (f) => f['userId'] == _currentUser.id && f['propertyId'] == propertyId,
    );
    return _ok({'isFavorite': !exists});
  }

  // ── Rent requests ────────────────────────────────────────────

  Future<Response> getRentRequests() async {
    await mockDelay();
    final role = _currentUser.role;
    final list = demoRentalRequests.where((r) {
      if (role == 'propietario') return r['ownerId'] == _currentUser.id;
      return r['tenantId'] == _currentUser.id;
    }).toList();
    return _ok({'data': list, 'requests': list});
  }

  Future<Response> createRentRequest(Map<String, dynamic> data) async {
    await mockDelay();
    return _ok({'request': {...data, 'id': 999, 'status': 'pending'}});
  }

  // ── Transactions ─────────────────────────────────────────────

  Future<Response> getTransactions() async {
    await mockDelay();
    return _ok({'data': <Map<String, dynamic>>[], 'transactions': <Map<String, dynamic>>[]});
  }

  Future<Response> createTransaction(Map<String, dynamic> data) async {
    await mockDelay();
    return _ok({'transaction': {...data, 'id': 999}});
  }

  // ── Chat ─────────────────────────────────────────────────────

  Future<Response> getConversations() async {
    await mockDelay();
    return _ok({'data': <Map<String, dynamic>>[], 'conversations': <Map<String, dynamic>>[]});
  }

  Future<Response> getMessages(int conversationId) async {
    await mockDelay();
    return _ok({'data': <Map<String, dynamic>>[], 'messages': <Map<String, dynamic>>[]});
  }

  Future<Response> sendMessage(
      int conversationId, Map<String, dynamic> data) async {
    await mockDelay();
    return _ok({'message': {...data, 'id': 999}});
  }

  // ── KYC ──────────────────────────────────────────────────────

  Future<Response> getKycStatus() async {
    await mockDelay();
    return _ok({
      'data': {
        'status': _currentUser.isVerified ? 'verified' : 'pending',
        'level': _currentUser.verificationLevel,
      },
      'status': _currentUser.isVerified ? 'verified' : 'pending',
      'level': _currentUser.verificationLevel,
    });
  }

  Future<Response> submitKyc(Map<String, dynamic> data) async {
    await mockDelay();
    return _ok({'message': 'KYC enviado (demo)'});
  }

  // ── User ─────────────────────────────────────────────────────

  Future<Response> getProfile() async {
    await mockDelay();
    return _ok({'data': _currentUser.toMap(), 'user': _currentUser.toMap()});
  }

  Future<Response> updateProfile(Map<String, dynamic> data) async {
    await mockDelay();
    return _ok({'data': {..._currentUser.toMap(), ...data}, 'user': {..._currentUser.toMap(), ...data}});
  }

  Future<Response> getPublicProfile(int userId) async {
    await mockDelay();
    final u = demoUsers.firstWhere(
      (e) => e.id == userId,
      orElse: () => demoUsers[0],
    );
    return _ok({'data': u.toMap(), 'user': u.toMap()});
  }

  // ── Exchange rate ────────────────────────────────────────────

  Future<Response> getExchangeRate() async {
    await mockDelay();
    return _ok({'data': {'rate': 4100.0, 'currency': 'COP'}, 'rate': 4100.0, 'currency': 'COP', 'source': 'demo'});
  }

  // ── Navigation ───────────────────────────────────────────────

  Future<Response> getRoute(
      double startLat, double startLng, double endLat, double endLng) async {
    await mockDelay();
    return _ok({
      'data': {
        'distance': 5.2,
        'duration': 18,
        'geometry': <Map<String, dynamic>>[],
      },
      'route': {
        'distance': 5.2,
        'duration': 18,
        'geometry': <Map<String, dynamic>>[],
      }
    });
  }

  // ── Notifications ────────────────────────────────────────────

  Future<Response> getNotifications() async {
    await mockDelay();
    return _ok({'data': <Map<String, dynamic>>[], 'notifications': <Map<String, dynamic>>[]});
  }

  Future<Response> markNotificationRead(int id) async {
    await mockDelay();
    return _ok({'message': 'Notificación marcada como leída (demo)'});
  }

  // ── Reviews ──────────────────────────────────────────────────

  Future<Response> getReviews(int userId) async {
    await mockDelay();
    return _ok({'data': <Map<String, dynamic>>[], 'reviews': <Map<String, dynamic>>[]});
  }

  Future<Response> createReview(Map<String, dynamic> data) async {
    await mockDelay();
    return _ok({'review': {...data, 'id': 999}});
  }

  // ── Admin ────────────────────────────────────────────────────

  Future<Response> getUsers({int page = 1, int limit = 20}) async {
    await mockDelay();
    final list = demoUsers.map((u) => u.toMap()).toList();
    return _ok({
      'data': list,
      'users': list,
      'pagination': {
        'page': page,
        'limit': limit,
        'total': demoUsers.length,
        'pages': 1,
      },
    });
  }

  Future<Response> updateUserStatus(int userId, String status) async {
    await mockDelay();
    return _ok({'message': 'Estado actualizado (demo)'});
  }

  Future<Response> getKycVerifications({int page = 1}) async {
    await mockDelay();
    return _ok({'data': <Map<String, dynamic>>[], 'verifications': <Map<String, dynamic>>[]});
  }

  Future<Response> approveKyc(int verificationId) async {
    await mockDelay();
    return _ok({'message': 'KYC aprobado (demo)'});
  }

  Future<Response> rejectKyc(int verificationId, String reason) async {
    await mockDelay();
    return _ok({'message': 'KYC rechazado (demo)'});
  }

  // ── Reports ──────────────────────────────────────────────────

  Future<Response> getReports() async {
    await mockDelay();
    return _ok({'data': <Map<String, dynamic>>[], 'reports': <Map<String, dynamic>>[]});
  }

  Future<Response> createReport(Map<String, dynamic> data) async {
    await mockDelay();
    return _ok({'report': {...data, 'id': 999}});
  }

  // ── Announcements ────────────────────────────────────────────

  Future<Response> getAnnouncements() async {
    await mockDelay();
    return _ok({'data': <Map<String, dynamic>>[], 'announcements': <Map<String, dynamic>>[]});
  }

  Future<Response> createAnnouncement(Map<String, dynamic> data) async {
    await mockDelay();
    return _ok({'announcement': {...data, 'id': 999}});
  }

  // ── Tickets ──────────────────────────────────────────────────

  Future<Response> getTickets() async {
    await mockDelay();
    return _ok({'data': <Map<String, dynamic>>[], 'tickets': <Map<String, dynamic>>[]});
  }

  Future<Response> createTicket(Map<String, dynamic> data) async {
    await mockDelay();
    return _ok({'ticket': {...data, 'id': 999}});
  }

  // ── Settings ─────────────────────────────────────────────────

  Future<Response> getSettings() async {
    await mockDelay();
    return _ok({'settings': <String, dynamic>{}});
  }

  Future<Response> updateSettings(Map<String, dynamic> data) async {
    await mockDelay();
    return _ok({'settings': data});
  }

  // ── Statistics / Analytics ────────────────────────────────────

  Future<Response> getStatistics() async {
    await mockDelay();
    return _ok({'data': demoAdminStats, 'statistics': demoAdminStats});
  }

  Future<Response> getAnalytics() async {
    await mockDelay();
    return _ok({'data': demoAdminStats, 'analytics': demoAdminStats});
  }

  // ── Helpers ──────────────────────────────────────────────────

  Response _ok(Map<String, dynamic> data) {
    return Response(
      requestOptions: RequestOptions(path: '/demo'),
      statusCode: 200,
      data: data,
    );
  }
}

/// Provider that holds the current demo role.
final demoRoleProvider = StateProvider<String?>((ref) => null);

/// Sets the demo role and enables demo mode.
void enableDemoMode(Ref ref, String role) {
  setDemoModeEnabled(true);
  ref.read(demoRoleProvider.notifier).state = role;
}

/// Disables demo mode and clears the demo role.
void disableDemoMode(Ref ref) {
  setDemoModeEnabled(false);
  ref.read(demoRoleProvider.notifier).state = null;
}

/// Provider for the demo API client.
final demoApiClientProvider = Provider<DemoApiClient>((ref) => DemoApiClient(ref));

/// Whether to use the demo client for the next API call.
bool shouldUseDemo(Ref ref) {
  if (!isDemoModeEnabled()) return false;
  if (kDebugMode) debugPrint('[Demo] Intercepting API call');
  return true;
}
