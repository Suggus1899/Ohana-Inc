import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../core/constants/app_constants.dart';
import '../../data/services/api_client.dart';

/// Auth service that handles token persistence and user session.
///
/// Uses flutter_secure_storage for JWT token and user data.
class AuthService {
  AuthService(this._ref);

  final Ref _ref;
  static const _storage = FlutterSecureStorage();

  /// Initialize auth state from stored token.
  Future<void> init() async {
    final token = await _storage.read(key: AppConstants.keyToken);
    final userJson = await _storage.read(key: AppConstants.keyUser);

    if (token != null && userJson != null) {
      final user = jsonDecode(userJson) as Map<String, dynamic>;
      _ref.read(authStateProvider.notifier).setAuthenticated(token, user);
    } else {
      _ref.read(authStateProvider.notifier).setUnauthenticated();
    }

    // Generate or load session ID
    String? sessionId = await _storage.read(key: AppConstants.keySessionId);
    if (sessionId == null) {
      sessionId = DateTime.now().millisecondsSinceEpoch.toString();
      await _storage.write(key: AppConstants.keySessionId, value: sessionId);
    }
    _ref.read(sessionIdProvider.notifier).state = sessionId;
  }

  /// Login with email and password.
  Future<void> login(String email, String password) async {
    final response = await _ref.read(apiClientProvider).login(email, password);
    final data = response.data as Map<String, dynamic>;
    final token = data['token'] as String;
    final user = data['user'] as Map<String, dynamic>;

    await _storage.write(key: AppConstants.keyToken, value: token);
    await _storage.write(key: AppConstants.keyUser, value: jsonEncode(user));
    _ref.read(authStateProvider.notifier).setAuthenticated(token, user);
  }

  /// Register a new user.
  Future<void> register(Map<String, dynamic> data) async {
    await _ref.read(apiClientProvider).register(data);
  }

  /// Logout and clear stored data.
  Future<void> logout() async {
    await _storage.delete(key: AppConstants.keyToken);
    await _storage.delete(key: AppConstants.keyUser);
    _ref.read(authStateProvider.notifier).logout();
  }

  /// Update stored user data after profile changes.
  Future<void> updateStoredUser(Map<String, dynamic> user) async {
    await _storage.write(key: AppConstants.keyUser, value: jsonEncode(user));
    final token = await _storage.read(key: AppConstants.keyToken);
    if (token != null) {
      _ref.read(authStateProvider.notifier).setAuthenticated(token, user);
    }
  }
}

final authServiceProvider = Provider<AuthService>((ref) => AuthService(ref));
