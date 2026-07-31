import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../core/constants/app_constants.dart';
import '../../data/services/api_client.dart';
import '../../data/services/demo_data.dart';
import '../../data/services/demo_api_client.dart';

/// Auth service that handles token persistence and user session.
///
/// Uses flutter_secure_storage for JWT token and user data.
/// Supports Demo Mode: when enabled, skips backend calls and uses mock data.
class AuthService {
  AuthService(this._ref);

  final Ref _ref;
  static const _storage = FlutterSecureStorage();

  static const _keyDemoMode = 'demo_mode';
  static const _keyDemoRole = 'demo_role';

  /// Initialize auth state from stored token or demo mode.
  Future<void> init() async {
    // Demo mode: bypass backend, restore demo user
    final demoFlag = await _storage.read(key: _keyDemoMode);
    if (demoFlag == 'true') {
      final role = await _storage.read(key: _keyDemoRole) ?? 'cliente';
      final demoUser = demoUserByRole(role);
      if (demoUser != null) {
        setDemoModeEnabled(true);
        _ref.read(demoRoleProvider.notifier).state = role;
        _ref
            .read(authStateProvider.notifier)
            .setAuthenticated('demo-token', demoUser.toMap());
        return;
      }
    }

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

  /// Login with email and password (real backend).
  Future<void> login(String email, String password) async {
    final response = await _ref.read(apiClientProvider).login(email, password);
    final data = response.data as Map<String, dynamic>;
    final token = data['token'] as String;
    final user = data['user'] as Map<String, dynamic>;

    await _storage.write(key: AppConstants.keyToken, value: token);
    await _storage.write(key: AppConstants.keyUser, value: jsonEncode(user));
    _ref.read(authStateProvider.notifier).setAuthenticated(token, user);
  }

  /// Login as a demo user with a predefined role. No backend call.
  Future<void> loginAsDemo(String role) async {
    final demoUser = demoUserByRole(role);
    if (demoUser == null) return;

    await _storage.write(key: _keyDemoMode, value: 'true');
    await _storage.write(key: _keyDemoRole, value: role);
    enableDemoMode(_ref, role);
    _ref
        .read(authStateProvider.notifier)
        .setAuthenticated('demo-token', demoUser.toMap());
  }

  /// Register a new user.
  Future<void> register(Map<String, dynamic> data) async {
    await _ref.read(apiClientProvider).register(data);
  }

  /// Verify email with token. If backend returns JWT + user, persist session.
  Future<bool> verifyEmail(String token) async {
    final response = await _ref.read(apiClientProvider).verifyEmail(token);
    final data = response.data as Map<String, dynamic>;
    final jwt = data['token'] as String?;
    final user = data['user'] as Map<String, dynamic>?;

    if (jwt != null && user != null) {
      await _storage.write(key: AppConstants.keyToken, value: jwt);
      await _storage.write(key: AppConstants.keyUser, value: jsonEncode(user));
      _ref.read(authStateProvider.notifier).setAuthenticated(jwt, user);
      return true;
    }
    return false;
  }

  /// Logout and clear stored data.
  Future<void> logout() async {
    final wasDemo = isDemoModeEnabled();
    if (wasDemo) {
      await _storage.delete(key: _keyDemoMode);
      await _storage.delete(key: _keyDemoRole);
      disableDemoMode(_ref);
    } else {
      await _storage.delete(key: AppConstants.keyToken);
      await _storage.delete(key: AppConstants.keyUser);
    }
    _ref.read(authStateProvider.notifier).logout();
  }

  /// Update stored user data after profile changes.
  Future<void> updateStoredUser(Map<String, dynamic> user) async {
    if (isDemoModeEnabled()) {
      _ref.read(authStateProvider.notifier).setAuthenticated('demo-token', user);
      return;
    }
    await _storage.write(key: AppConstants.keyUser, value: jsonEncode(user));
    final token = await _storage.read(key: AppConstants.keyToken);
    if (token != null) {
      _ref.read(authStateProvider.notifier).setAuthenticated(token, user);
    }
  }

  /// Whether demo mode is currently active.
  bool get isDemoMode => isDemoModeEnabled();
}

final authServiceProvider = Provider<AuthService>((ref) => AuthService(ref));
