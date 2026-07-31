import 'package:flutter/material.dart';

import '../../data/services/demo_data.dart';

/// Banner shown at the top of dashboards when Demo Mode is active.
///
/// Mirrors the web frontend `DashboardLayout` demo banner: amber background,
/// sparkles icon, "Modo demo" label. Dismissible for the current session.
class DemoModeBanner extends StatelessWidget {
  const DemoModeBanner({super.key, this.onDismiss});

  final VoidCallback? onDismiss;

  @override
  Widget build(BuildContext context) {
    if (!isDemoModeEnabled()) return const SizedBox.shrink();

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: const BoxDecoration(
        color: Color(0xFFF59E0B),
      ),
      child: Row(
        children: [
          const Icon(Icons.bolt, color: Colors.white, size: 18),
          const SizedBox(width: 10),
          const Expanded(
            child: Text(
              'Modo demo — estás viendo datos ficticios',
              style: TextStyle(
                color: Colors.white,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          if (onDismiss != null)
            InkWell(
              onTap: onDismiss,
              child: const Padding(
                padding: EdgeInsets.all(2),
                child: Icon(Icons.close, color: Colors.white, size: 18),
              ),
            ),
        ],
      ),
    );
  }
}

/// Whether demo mode is active (convenience wrapper).
bool get isDemoMode => isDemoModeEnabled();
