import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme/app_theme.dart';
import 'core/router/app_router.dart';
import 'presentation/providers/auth_provider.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: OhanaApp()));
}

class OhanaApp extends ConsumerStatefulWidget {
  const OhanaApp({super.key});

  @override
  ConsumerState<OhanaApp> createState() => _OhanaAppState();
}

class _OhanaAppState extends ConsumerState<OhanaApp> {
  bool _initialized = false;

  @override
  void initState() {
    super.initState();
    _initAuth();
  }

  Future<void> _initAuth() async {
    await ref.read(authServiceProvider).init();
    if (mounted) setState(() => _initialized = true);
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
