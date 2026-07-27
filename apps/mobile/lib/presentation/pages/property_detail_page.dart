import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/services/api_client.dart';

/// Property detail page showing full information about a single listing.
class PropertyDetailPage extends ConsumerStatefulWidget {
  const PropertyDetailPage({super.key, required this.propertyId});

  final int propertyId;

  @override
  ConsumerState<PropertyDetailPage> createState() => _PropertyDetailPageState();
}

class _PropertyDetailPageState extends ConsumerState<PropertyDetailPage> {
  Map<String, dynamic>? _property;
  bool _isLoading = true;
  String? _error;
  int _currentImage = 0;

  @override
  void initState() {
    super.initState();
    _loadProperty();
  }

  Future<void> _loadProperty() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final res = await ref.read(apiClientProvider).getProperty(widget.propertyId);
      if (mounted) {
        setState(() {
          _property = res.data['data'] as Map<String, dynamic>?;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'No se pudo cargar la propiedad';
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        title: const Text('Detalle de propiedad'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(_error!),
                      const SizedBox(height: 12),
                      FilledButton(
                        onPressed: _loadProperty,
                        child: const Text('Reintentar'),
                      ),
                    ],
                  ),
                )
              : _buildContent(colorScheme),
      bottomNavigationBar: _property == null ? null : _buildActions(colorScheme),
    );
  }

  Widget _buildContent(ColorScheme colorScheme) {
    final p = _property!;
    final images = (p['images'] as List?)?.cast<String>() ?? const [];
    final features = (p['features'] as List?)?.cast<String>() ?? const [];
    final price = (p['price'] as num?)?.toDouble() ?? 0;
    final priceCop = price.toStringAsFixed(0);
    final priceUsd = (price / 4000).toStringAsFixed(2);

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Image gallery
          SizedBox(
            height: 260,
            child: images.isEmpty
                ? Container(
                    color: colorScheme.surfaceContainerHighest,
                    child: Icon(Icons.image_outlined,
                        size: 64, color: colorScheme.primary),
                  )
                : PageView.builder(
                    itemCount: images.length,
                    onPageChanged: (i) => setState(() => _currentImage = i),
                    itemBuilder: (context, i) => Image.network(
                      images[i],
                      fit: BoxFit.cover,
                      errorBuilder: (_, _, _) => Container(
                        color: colorScheme.surfaceContainerHighest,
                        child: Icon(Icons.broken_image_outlined,
                            size: 64, color: colorScheme.primary),
                      ),
                    ),
                  ),
          ),
          if (images.isNotEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(
                  images.length,
                  (i) => Container(
                    width: 8,
                    height: 8,
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: i == _currentImage
                          ? colorScheme.primary
                          : colorScheme.outline,
                    ),
                  ),
                ),
              ),
            ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title
                Text(
                  (p['title'] as String?) ?? '',
                  style: TextStyle(
                    color: colorScheme.onSurface,
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 8),
                // Price (dual)
                Row(
                  children: [
                    Text(
                      '\$$priceUsd USD',
                      style: TextStyle(
                        color: colorScheme.primary,
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      '\$$priceCop COP',
                      style: TextStyle(
                        color: colorScheme.onSurfaceVariant,
                        fontSize: 15,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                // Location
                Row(
                  children: [
                    Icon(Icons.location_on_outlined,
                        size: 18, color: colorScheme.onSurfaceVariant),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        (p['location'] as String?) ?? '',
                        style: TextStyle(
                          color: colorScheme.onSurfaceVariant,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                // Specs
                _SpecsRow(property: p, colorScheme: colorScheme),
                const SizedBox(height: 16),
                // Features chips
                if (features.isNotEmpty) ...[
                  Text(
                    'Caracteristicas',
                    style: TextStyle(
                      color: colorScheme.onSurface,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: features
                        .map((f) => Chip(
                              label: Text(f),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ))
                        .toList(),
                  ),
                  const SizedBox(height: 16),
                ],
                // Description
                Text(
                  'Descripcion',
                  style: TextStyle(
                    color: colorScheme.onSurface,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  (p['description'] as String?) ?? '',
                  style: TextStyle(
                    color: colorScheme.onSurfaceVariant,
                    fontSize: 14,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 16),
                // Map preview placeholder
                Text(
                  'Ubicacion',
                  style: TextStyle(
                    color: colorScheme.onSurface,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  height: 180,
                  decoration: BoxDecoration(
                    color: colorScheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: Icon(Icons.map_outlined,
                        size: 48, color: colorScheme.primary),
                  ),
                ),
                const SizedBox(height: 16),
                // Owner info card
                _OwnerCard(colorScheme: colorScheme, property: p),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActions(ColorScheme colorScheme) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Expanded(
                  child: FilledButton.icon(
                    onPressed: () => _solicitarArriendo(),
                    icon: const Icon(Icons.assignment_outlined),
                    label: const Text('Solicitar arriendo'),
                    style: FilledButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.outlined(
                  onPressed: () => _contactarWhatsApp(),
                  icon: const Icon(Icons.chat_outlined),
                  style: IconButton.styleFrom(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () =>
                    context.go('/navigation/${widget.propertyId}'),
                icon: const Icon(Icons.directions_outlined),
                label: const Text('Ver direccion'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _solicitarArriendo() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Solicitud de arriendo enviada')),
    );
  }

  void _contactarWhatsApp() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Abriendo WhatsApp...')),
    );
  }
}

// ── Specs row ───────────────────────────────────────────────────────────────
class _SpecsRow extends StatelessWidget {
  const _SpecsRow({required this.property, required this.colorScheme});

  final Map<String, dynamic> property;
  final ColorScheme colorScheme;

  @override
  Widget build(BuildContext context) {
    final specs = [
      (Icons.bed_outlined, '${property['bedrooms'] ?? 0} hab'),
      (Icons.bathtub_outlined, '${property['bathrooms'] ?? 0} banos'),
      (Icons.crop_free_outlined, '${property['area'] ?? 0} m2'),
    ];

    return Row(
      children: specs
          .map((s) => Expanded(
                child: Container(
                  margin: const EdgeInsets.only(right: 8),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    color: colorScheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    children: [
                      Icon(s.$1, color: colorScheme.primary),
                      const SizedBox(height: 4),
                      Text(
                        s.$2,
                        style: TextStyle(
                          color: colorScheme.onSurface,
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ))
          .toList(),
    );
  }
}

// ── Owner card ──────────────────────────────────────────────────────────────
class _OwnerCard extends StatelessWidget {
  const _OwnerCard({required this.colorScheme, required this.property});

  final ColorScheme colorScheme;
  final Map<String, dynamic> property;

  @override
  Widget build(BuildContext context) {
    final owner = property['owner'] as Map<String, dynamic>?;
    final name = (owner?['name'] as String?) ?? 'Propietario';

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: colorScheme.outline),
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: colorScheme.surfaceContainerHighest,
            child: Icon(Icons.person_outline, color: colorScheme.primary),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: TextStyle(
                    color: colorScheme.onSurface,
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  'Propietario',
                  style: TextStyle(
                    color: colorScheme.onSurfaceVariant,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
