import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// OAuth callback page.
///
/// Shows a loading indicator while the OAuth flow is processed, then navigates
/// to the Google setup screen. This is a placeholder implementation.
class AuthCallbackPage extends ConsumerStatefulWidget {
  const AuthCallbackPage({super.key});

  @override
  ConsumerState<AuthCallbackPage> createState() => _AuthCallbackPageState();
}

class _AuthCallbackPageState extends ConsumerState<AuthCallbackPage> {
  @override
  void initState() {
    super.initState();
    _handleCallback();
  }

  // Placeholder OAuth handler: wait 2 seconds then route to setup.
  Future<void> _handleCallback() async {
    await Future.delayed(const Duration(seconds: 2));
    if (mounted) {
      context.go('/auth/google-setup');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: const [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Procesando autenticación...'),
          ],
        ),
      ),
    );
  }
}
