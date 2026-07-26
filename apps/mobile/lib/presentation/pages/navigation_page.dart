import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_colors.dart';
import '../../data/services/api_client.dart';

/// Full-screen navigation page for a property.
///
/// Shows a map placeholder, a bottom sheet with the property address and an
/// "Abrir en Google Maps" button, route info, and a back button.
class NavigationPage extends ConsumerStatefulWidget {
  const NavigationPage({super.key, required this.propertyId});

  final int propertyId;

  @override
  ConsumerState<NavigationPage> createState() => _NavigationPageState();
}

class _NavigationPageState extends ConsumerState<NavigationPage> {
  Map<String, dynamic>? _property;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadProperty();
  }

  Future<void> _loadProperty() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await ref.read(apiClientProvider).getProperty(widget.propertyId);
      final data = res.data['data'] as Map<String, dynamic>? ?? res.data;
      setState(() {
        _property = data;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'No se pudo cargar la propiedad';
        _loading = false;
      });
    }
  }

  void _openGoogleMaps() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Abriendo Google Maps...')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        title: const Text('Ubicación'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(_error!),
                      const SizedBox(height: 12),
                      ElevatedButton(
                          onPressed: _loadProperty, child: const Text('Reintentar')),
                    ],
                  ),
                )
              : Stack(
                  children: [
                    // ── Map placeholder ─────────────────────────────
                    Positioned.fill(
                      child: Container(
                        color: AppColors.primary.withValues(alpha: 0.08),
                        child: Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.map_outlined,
                                  size: 72, color: AppColors.primary),
                              const SizedBox(height: 12),
                              Text('Mapa',
                                  style: TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.primary)),
                            ],
                          ),
                        ),
                      ),
                    ),

                    // ── Bottom sheet ────────────────────────────────
                    DraggableScrollableSheet(
                      initialChildSize: 0.4,
                      minChildSize: 0.3,
                      maxChildSize: 0.7,
                      builder: (context, scrollController) {
                        return Container(
                          decoration: const BoxDecoration(
                            color: AppColors.card,
                            borderRadius: BorderRadius.vertical(
                                top: Radius.circular(12)),
                          ),
                          child: ListView(
                            controller: scrollController,
                            padding: const EdgeInsets.all(20),
                            children: [
                              Center(
                                child: Container(
                                  width: 40,
                                  height: 4,
                                  margin: const EdgeInsets.only(bottom: 16),
                                  decoration: BoxDecoration(
                                    color: AppColors.border,
                                    borderRadius: BorderRadius.circular(2),
                                  ),
                                ),
                              ),
                              Text(((_property?['title']) as String?) ?? '',
                                  style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w700)),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  Icon(Icons.location_on,
                                      size: 16, color: AppColors.accent),
                                  const SizedBox(width: 4),
                                  Expanded(
                                    child: Text(
                                      (_property?['address'] as String?) ?? '',
                                      style: TextStyle(
                                          color: AppColors.mutedForeground),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              // ── Route info placeholder ──────────────
                              Row(
                                children: [
                                  _RouteInfoChip(
                                    icon: Icons.directions_outlined,
                                    label: 'Distancia',
                                    value: '— km',
                                  ),
                                  const SizedBox(width: 12),
                                  _RouteInfoChip(
                                    icon: Icons.access_time_outlined,
                                    label: 'Duración',
                                    value: '— min',
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton.icon(
                                  onPressed: _openGoogleMaps,
                                  icon: const Icon(Icons.map),
                                  label: const Text('Abrir en Google Maps'),
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ],
                ),
    );
  }
}

class _RouteInfoChip extends StatelessWidget {
  const _RouteInfoChip({
    required this.icon,
    required this.label,
    required this.value,
  });
  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.muted,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 18, color: AppColors.primary),
            const SizedBox(height: 6),
            Text(value,
                style: const TextStyle(
                    fontWeight: FontWeight.w700, fontSize: 15)),
            Text(label,
                style: TextStyle(
                    color: AppColors.mutedForeground, fontSize: 12)),
          ],
        ),
      ),
    );
  }
}
