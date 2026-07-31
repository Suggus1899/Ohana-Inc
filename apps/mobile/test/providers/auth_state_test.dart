import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:ohana_mobile/data/services/api_client.dart';

/// Tests for AuthNotifier / AuthState — the core auth state machine.
///
/// These verify the state transitions that gate the entire app:
/// initial → authenticated → unauthenticated, and that the token
/// provider stays in sync with auth state.
void main() {
  late ProviderContainer container;

  setUp(() {
    container = ProviderContainer();
  });

  tearDown(() {
    container.dispose();
  });

  group('AuthState', () {
    test('initial state is initial with null user', () {
      final state = const AuthState();
      expect(state.status, AuthStatus.initial);
      expect(state.user, isNull);
    });

    test('copyWith preserves unchanged fields', () {
      const original = AuthState(
        status: AuthStatus.authenticated,
        user: {'id': 1, 'name': 'Test'},
      );
      final copied = original.copyWith(status: AuthStatus.unauthenticated);
      expect(copied.status, AuthStatus.unauthenticated);
      expect(copied.user, {'id': 1, 'name': 'Test'});
    });

    test('copyWith preserves status when only user changes', () {
      const original = AuthState(status: AuthStatus.authenticated);
      final copied = original.copyWith(user: {'id': 2});
      expect(copied.status, AuthStatus.authenticated);
      expect(copied.user, {'id': 2});
    });
  });

  group('AuthNotifier', () {
    test('starts in initial state', () {
      final authState = container.read(authStateProvider);
      expect(authState.status, AuthStatus.initial);
      expect(authState.user, isNull);
    });

    test('setAuthenticated transitions to authenticated with user and token', () {
      final user = {'id': 1, 'name': 'Admin', 'role': 'admin'};
      container.read(authStateProvider.notifier).setAuthenticated('jwt-token', user);

      final authState = container.read(authStateProvider);
      expect(authState.status, AuthStatus.authenticated);
      expect(authState.user, user);
      expect(container.read(authTokenProvider), 'jwt-token');
    });

    test('logout transitions to unauthenticated and clears token', () {
      // First authenticate
      container.read(authStateProvider.notifier).setAuthenticated('jwt-token', {'id': 1});
      expect(container.read(authStateProvider).status, AuthStatus.authenticated);
      expect(container.read(authTokenProvider), 'jwt-token');

      // Then logout
      container.read(authStateProvider.notifier).logout();

      final authState = container.read(authStateProvider);
      expect(authState.status, AuthStatus.unauthenticated);
      expect(authState.user, isNull);
      expect(container.read(authTokenProvider), isNull);
    });

    test('setUnauthenticated transitions without touching token', () {
      // First authenticate with a token
      container.read(authStateProvider.notifier).setAuthenticated('jwt-token', {'id': 1});
      expect(container.read(authTokenProvider), 'jwt-token');

      // setUnauthenticated only changes state, not token
      container.read(authStateProvider.notifier).setUnauthenticated();

      expect(container.read(authStateProvider).status, AuthStatus.unauthenticated);
      // Token is NOT cleared by setUnauthenticated (unlike logout)
      expect(container.read(authTokenProvider), 'jwt-token');
    });

    test('setAuthenticated replaces previous user on re-auth', () {
      container.read(authStateProvider.notifier).setAuthenticated('token-1', {'id': 1, 'name': 'First'});
      container.read(authStateProvider.notifier).setAuthenticated('token-2', {'id': 2, 'name': 'Second'});

      final authState = container.read(authStateProvider);
      expect(authState.user, {'id': 2, 'name': 'Second'});
      expect(container.read(authTokenProvider), 'token-2');
    });
  });
}
