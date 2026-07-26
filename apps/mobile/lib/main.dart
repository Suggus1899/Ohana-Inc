import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme/app_theme.dart';
import 'core/router/app_router.dart';
import 'presentation/providers/auth_provider.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  // Catch errors outside Flutter's build tree (async, isolates)
  PlatformDispatcher.instance.onError = (error, stack) {
    debugPrint('Unhandled platform error: $error\n$stack');
    return true;
  };

  // Catch errors in Flutter's build/layout/paint phases
  FlutterError.onError = (details) {
    FlutterError.presentError(details);
    debugPrint('Flutter error: ${details.exception}\n${details.stack}');
  };

  runApp(const ProviderScope(child: OhanaApp()));
}

class OhanaApp extends ConsumerStatefulWidget {
  const OhanaApp({super.key});

  @override
  ConsumerState<OhanaApp> createState() => _OhanaAppState();
}

class _OhanaAppState extends ConsumerState<OhanaApp> {
  bool _initialized = false;
  bool _initFailed = false;

  @override
  void initState() {
    super.initState();
    _initAuth();
  }

  Future<void> _initAuth() async {
    try {
      await ref.read(authServiceProvider).init();
      if (mounted) setState(() => _initialized = true);
    } catch (e, stack) {
      debugPrint('Auth init failed: $e\n$stack');
      // Mark as initialized so user can proceed to login
      // rather than being stuck on a loading screen forever
      if (mounted) {
        setState(() {
          _initialized = true;
          _initFailed = true;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(routerProvider);

    if (!_initialized) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light(),
        darkTheme: AppTheme.dark(),
        home: Scaffold(
          body: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                CircularProgressIndicator(
                  color: Theme.of(context).colorScheme.primary,
                ),
                const SizedBox(height: 16),
                const Text('Cargando Ohana...'),
              ],
            ),
          ),
        ),
      );
    }

    return MaterialApp.router(
      title: 'Ohana',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: ThemeMode.system,
      routerConfig: router,
    );
  }
}
