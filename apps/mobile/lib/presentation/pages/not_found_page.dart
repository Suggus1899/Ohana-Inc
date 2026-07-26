import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// 404 page shown when no route matches.
class NotFoundPage extends ConsumerWidget {
  const NotFoundPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: const Text('404')),
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.search_off_outlined,
                    size: 80, color: colorScheme.primary),
                const SizedBox(height: 16),
                Text(
                  'Pagina no encontrada',
                  style: TextStyle(
                    color: colorScheme.onSurface,
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'La pagina que buscas no existe o fue movida.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: colorScheme.onSurfaceVariant,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: () => context.go('/'),
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text('Ir al inicio'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
