import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';

/// Reusable widgets matching the web frontend component library.

/// Property card for lists and grids.
class PropertyCard extends StatelessWidget {
  const PropertyCard({
    super.key,
    required this.imageUrl,
    required this.title,
    required this.price,
    required this.location,
    this.bedrooms,
    this.bathrooms,
    this.area,
    this.isFeatured = false,
    this.onTap,
  });

  final String imageUrl;
  final String title;
  final String price;
  final String location;
  final int? bedrooms;
  final int? bathrooms;
  final double? area;
  final bool isFeatured;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            Stack(
              children: [
                CachedNetworkImage(
                  imageUrl: imageUrl,
                  height: 180,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  placeholder: (context, url) => Container(
                    height: 180,
                    color: theme.colorScheme.surfaceContainerHighest,
                    child: const Center(child: CircularProgressIndicator()),
                  ),
                  errorWidget: (context, url, error) => Container(
                    height: 180,
                    color: theme.colorScheme.surfaceContainerHighest,
                    child: Icon(Icons.home_outlined, size: 48, color: theme.colorScheme.outline),
                  ),
                ),
                if (isFeatured)
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.tertiary,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        'Destacado',
                        style: TextStyle(
                          color: theme.colorScheme.onTertiary,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            // Content
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    price,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: theme.colorScheme.primary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    title,
                    style: theme.textTheme.titleSmall,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.location_on_outlined, size: 14, color: theme.colorScheme.outline),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          location,
                          style: TextStyle(fontSize: 12, color: theme.colorScheme.outline),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  if (bedrooms != null || bathrooms != null || area != null) ...[
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        if (bedrooms != null) ...[
                          Icon(Icons.bed_outlined, size: 16, color: theme.colorScheme.outline),
                          const SizedBox(width: 4),
                          Text('$bedrooms', style: TextStyle(fontSize: 12, color: theme.colorScheme.outline)),
                          const SizedBox(width: 12),
                        ],
                        if (bathrooms != null) ...[
                          Icon(Icons.bathtub_outlined, size: 16, color: theme.colorScheme.outline),
                          const SizedBox(width: 4),
                          Text('$bathrooms', style: TextStyle(fontSize: 12, color: theme.colorScheme.outline)),
                          const SizedBox(width: 12),
                        ],
                        if (area != null) ...[
                          Icon(Icons.square_foot_outlined, size: 16, color: theme.colorScheme.outline),
                          const SizedBox(width: 4),
                          Text('${area!.toInt()} m2', style: TextStyle(fontSize: 12, color: theme.colorScheme.outline)),
                        ],
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Status badge widget.
class StatusBadge extends StatelessWidget {
  const StatusBadge({
    super.key,
    required this.status,
    this.label,
  });

  final String status;
  final String? label;

  @override
  Widget build(BuildContext context) {
    final (color, text) = _statusStyle(context, status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label ?? text,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }

  (Color, String) _statusStyle(BuildContext context, String status) {
    final theme = Theme.of(context);
    switch (status) {
      case 'active':
      case 'approved':
      case 'completed':
        return (Colors.green, 'Activo');
      case 'pending':
        return (Colors.orange, 'Pendiente');
      case 'suspended':
      case 'rejected':
        return (theme.colorScheme.error, 'Suspendido');
      default:
        return (theme.colorScheme.outline, status);
    }
  }
}

/// Empty state widget.
class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    this.message,
    this.action,
  });

  final IconData icon;
  final String title;
  final String? message;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 64, color: theme.colorScheme.outline),
            const SizedBox(height: 16),
            Text(title, style: theme.textTheme.titleMedium, textAlign: TextAlign.center),
            if (message != null) ...[
              const SizedBox(height: 8),
              Text(
                message!,
                style: TextStyle(color: theme.colorScheme.outline),
                textAlign: TextAlign.center,
              ),
            ],
            if (action != null) ...[
              const SizedBox(height: 24),
              action!,
            ],
          ],
        ),
      ),
    );
  }
}

/// Loading indicator widget.
class LoadingView extends StatelessWidget {
  const LoadingView({super.key, this.message});

  final String? message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(),
          if (message != null) ...[
            const SizedBox(height: 16),
            Text(message!, style: Theme.of(context).textTheme.bodyMedium),
          ],
        ],
      ),
    );
  }
}

/// Section header widget.
class SectionHeader extends StatelessWidget {
  const SectionHeader({
    super.key,
    required this.title,
    this.action,
  });

  final String title;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(title, style: Theme.of(context).textTheme.titleLarge),
        if (action != null) action!,
      ],
    );
  }
}
