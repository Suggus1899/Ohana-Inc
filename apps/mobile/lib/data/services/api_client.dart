import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../core/config/app_config.dart';
import '../../core/constants/app_constants.dart';

/// Dio-based HTTP client for the Ohana backend.
///
/// Intercepts requests to add JWT token from secure storage,
/// and handles 401 responses by clearing auth state.
class ApiClient {
  ApiClient(this._ref) {
    _dio = Dio(_baseOptions);
    _dio.interceptors.add(_AuthInterceptor(_ref));
    if (kDebugMode) {
      _dio.interceptors.add(LogInterceptor(
        requestBody: true,
        responseBody: true,
        requestHeader: false,
        responseHeader: false,
        error: true,
        logPrint: (obj) => debugPrint('[API] $obj'),
      ));
    }
  }

  final Ref _ref;
  late final Dio _dio;

  static final BaseOptions _baseOptions = BaseOptions(
    baseUrl: AppConfig.apiBaseUrl,
    connectTimeout: const Duration(seconds: 15),
    receiveTimeout: const Duration(seconds: 30),
    sendTimeout: const Duration(seconds: 30),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  );

  Dio get dio => _dio;

  // ── Auth ─────────────────────────────────────────────────────

  Future<Response> login(String email, String password) =>
      _dio.post('/auth/login', data: {'email': email, 'password': password});

  Future<Response> register(Map<String, dynamic> data) =>
      _dio.post('/auth/register', data: data);

  Future<Response> forgotPassword(String email) =>
      _dio.post('/auth/forgot-password', data: {'email': email});

  Future<Response> verifyEmail(String token) =>
      _dio.post('/auth/verify-email', data: {'token': token});

  Future<Response> getMe() => _dio.get('/auth/me');

  // ── Properties ───────────────────────────────────────────────

  Future<Response> getProperties({int page = 1, int limit = 20, String? search}) {
    final params = <String, dynamic>{'page': page, 'limit': limit};
    if (search != null) params['search'] = search;
    return _dio.get('/properties', queryParameters: params);
  }

  Future<Response> getProperty(int id) => _dio.get('/properties/$id');

  Future<Response> createProperty(Map<String, dynamic> data) =>
      _dio.post('/properties', data: data);

  Future<Response> updateProperty(int id, Map<String, dynamic> data) =>
      _dio.put('/properties/$id', data: data);

  Future<Response> deleteProperty(int id) => _dio.delete('/properties/$id');

  // ── Favorites ────────────────────────────────────────────────

  Future<Response> getFavorites() => _dio.get('/favorites');

  Future<Response> toggleFavorite(int propertyId) =>
      _dio.post('/favorites', data: {'propertyId': propertyId});

  // ── Rent requests ────────────────────────────────────────────

  Future<Response> getRentRequests() => _dio.get('/rent');

  Future<Response> createRentRequest(Map<String, dynamic> data) =>
      _dio.post('/rent', data: data);

  // ── Transactions ─────────────────────────────────────────────

  Future<Response> getTransactions() => _dio.get('/transactions');

  Future<Response> createTransaction(Map<String, dynamic> data) =>
      _dio.post('/transactions', data: data);

  // ── Chat ─────────────────────────────────────────────────────

  Future<Response> getConversations() => _dio.get('/chat/conversations');

  Future<Response> getMessages(int conversationId) =>
      _dio.get('/chat/conversations/$conversationId/messages');

  Future<Response> sendMessage(int conversationId, Map<String, dynamic> data) =>
      _dio.post('/chat/conversations/$conversationId/messages', data: data);

  // ── KYC ──────────────────────────────────────────────────────

  Future<Response> getKycStatus() => _dio.get('/kyc/status');

  Future<Response> submitKyc(Map<String, dynamic> data) =>
      _dio.post('/kyc/submit', data: data);

  // ── User ─────────────────────────────────────────────────────

  Future<Response> getProfile() => _dio.get('/users/me');

  Future<Response> updateProfile(Map<String, dynamic> data) =>
      _dio.put('/users/me', data: data);

  Future<Response> getPublicProfile(int userId) => _dio.get('/users/$userId');

  // ── Exchange rate ────────────────────────────────────────────

  Future<Response> getExchangeRate() => _dio.get('/exchange-rate');

  // ── Navigation ───────────────────────────────────────────────

  Future<Response> getRoute(double startLat, double startLng, double endLat, double endLng) =>
      _dio.get('/navigation/route', queryParameters: {
        'startLat': startLat,
        'startLng': startLng,
        'endLat': endLat,
        'endLng': endLng,
      });

  // ── Notifications ────────────────────────────────────────────

  Future<Response> getNotifications() => _dio.get('/notifications');

  Future<Response> markNotificationRead(int id) =>
      _dio.put('/notifications/$id/read');

  // ── Reviews ──────────────────────────────────────────────────

  Future<Response> getReviews(int userId) => _dio.get('/reviews/user/$userId');

  Future<Response> createReview(Map<String, dynamic> data) =>
      _dio.post('/reviews', data: data);

  // ── Admin ────────────────────────────────────────────────────

  Future<Response> getUsers({int page = 1, int limit = 20}) =>
      _dio.get('/users', queryParameters: {'page': page, 'limit': limit});

  Future<Response> updateUserStatus(int userId, String status) =>
      _dio.put('/users/$userId/status', data: {'status': status});

  Future<Response> getKycVerifications({int page = 1}) =>
      _dio.get('/kyc/verifications', queryParameters: {'page': page});

  Future<Response> approveKyc(int verificationId) =>
      _dio.put('/kyc/verifications/$verificationId/approve');

  Future<Response> rejectKyc(int verificationId, String reason) =>
      _dio.put('/kyc/verifications/$verificationId/reject', data: {'reason': reason});

  // ── Reports ──────────────────────────────────────────────────

  Future<Response> getReports() => _dio.get('/reports');

  Future<Response> createReport(Map<String, dynamic> data) =>
      _dio.post('/reports', data: data);

  // ── Announcements ────────────────────────────────────────────

  Future<Response> getAnnouncements() => _dio.get('/announcements');

  Future<Response> createAnnouncement(Map<String, dynamic> data) =>
      _dio.post('/announcements', data: data);

  // ── Tickets ──────────────────────────────────────────────────

  Future<Response> getTickets() => _dio.get('/tickets');

  Future<Response> createTicket(Map<String, dynamic> data) =>
      _dio.post('/tickets', data: data);

  // ── Settings ─────────────────────────────────────────────────

  Future<Response> getSettings() => _dio.get('/settings');

  Future<Response> updateSettings(Map<String, dynamic> data) =>
      _dio.put('/settings', data: data);

  // ── Statistics ───────────────────────────────────────────────

  Future<Response> getStatistics() => _dio.get('/statistics');

  // ── Analytics ────────────────────────────────────────────────

  Future<Response> getAnalytics() => _dio.get('/analytics');
}

/// Interceptor that adds JWT token to every request.
class _AuthInterceptor extends Interceptor {
  _AuthInterceptor(this._ref);

  final Ref _ref;

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final token = _ref.read(authTokenProvider);
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    // Add session ID header for analytics
    final sessionId = _ref.read(sessionIdProvider);
    if (sessionId != null) {
      options.headers['x-session-id'] = sessionId;
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (err.response?.statusCode == 401) {
      // Token expired or invalid — clear auth state AND secure storage
      // so the app doesn't restore the expired token on next launch
      _ref.read(authStateProvider.notifier).logout();
      const FlutterSecureStorage().delete(key: AppConstants.keyToken);
      const FlutterSecureStorage().delete(key: AppConstants.keyUser);
    }
    handler.next(err);
  }
}

/// Providers
final apiClientProvider = Provider<ApiClient>((ref) => ApiClient(ref));

/// Auth token provider (stored in secure storage)
final authTokenProvider = StateProvider<String?>((ref) => null);

/// Session ID provider
final sessionIdProvider = StateProvider<String?>((ref) => null);

/// Auth state notifier
final authStateProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref);
});

enum AuthStatus { initial, authenticated, unauthenticated }

class AuthState {
  final AuthStatus status;
  final Map<String, dynamic>? user;

  const AuthState({this.status = AuthStatus.initial, this.user});

  AuthState copyWith({AuthStatus? status, Map<String, dynamic>? user}) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier(this._ref) : super(const AuthState());

  final Ref _ref;

  void setAuthenticated(String token, Map<String, dynamic> user) {
    _ref.read(authTokenProvider.notifier).state = token;
    state = AuthState(status: AuthStatus.authenticated, user: user);
  }

  void logout() {
    _ref.read(authTokenProvider.notifier).state = null;
    state = const AuthState(status: AuthStatus.unauthenticated);
  }

  void setUnauthenticated() {
    state = const AuthState(status: AuthStatus.unauthenticated);
  }
}
