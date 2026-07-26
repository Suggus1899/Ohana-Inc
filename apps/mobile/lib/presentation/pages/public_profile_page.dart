import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_colors.dart';
import '../../data/services/api_client.dart';

/// Public profile page for any user by id.
///
/// Shows photo, name, rating as owner/tenant, active listings count,
/// reviews list, and a "Contactar" button.
class PublicProfilePage extends ConsumerStatefulWidget {
  const PublicProfilePage({super.key, required this.userId});

  final int userId;

  @override
  ConsumerState<PublicProfilePage> createState() => _PublicProfilePageState();
}

class _PublicProfilePageState extends ConsumerState<PublicProfilePage> {
  Map<String, dynamic>? _user;
  List<dynamic> _reviews = [];
  int _activeListings = 0;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final api = ref.read(apiClientProvider);
      final userRes = await api.getPublicProfile(widget.userId);
      final userData =
          userRes.data['data'] as Map<String, dynamic>? ?? userRes.data;
      final reviewsRes = await api.getReviews(widget.userId);
      final reviewsData = reviewsRes.data['data'] as List?;
      // Active listings count is not exposed by a dedicated endpoint;
      // derive from the user payload when available.
      setState(() {
        _user = userData;
        _reviews = reviewsData ?? [];
        _activeListings = (userData?['activeListings'] as int?) ?? 0;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'No se pudo cargar el perfil';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Perfil')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    if (_error != null || _user == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Perfil')),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(_error ?? 'Perfil no disponible'),
              const SizedBox(height: 12),
              ElevatedButton(onPressed: _load, child: const Text('Reintentar')),
            ],
          ),
        ),
      );
    }

    final u = _user!;
    final name = (u['name'] as String?) ?? 'Usuario';
    final photo = u['profilePhotoUrl'] as String?;
    final ownerRating =
        (u['avgRatingAsOwner'] as num?)?.toDouble() ?? 0.0;
    final ownerCount = (u['reviewCountAsOwner'] as int?) ?? 0;
    final tenantRating =
        (u['avgRatingAsTenant'] as num?)?.toDouble() ?? 0.0;
    final tenantCount = (u['reviewCountAsTenant'] as int?) ?? 0;

    return Scaffold(
      appBar: AppBar(title: const Text('Perfil')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // ── Header ──────────────────────────────────────────────
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 44,
                    backgroundColor: AppColors.muted,
                    backgroundImage: photo != null ? NetworkImage(photo) : null,
                    child: photo == null
                        ? const Icon(Icons.person, size: 40,
                            color: AppColors.mutedForeground)
                        : null,
                  ),
                  const SizedBox(height: 12),
                  Text(name,
                      style: const TextStyle(
                          fontSize: 18, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      _RatingColumn(
                        label: 'Como propietario',
                        rating: ownerRating,
                        count: ownerCount,
                      ),
                      Container(
                          width: 1,
                          height: 36,
                          color: AppColors.border),
                      _RatingColumn(
                        label: 'Como inquilino',
                        rating: tenantRating,
                        count: tenantCount,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // ── Active listings ─────────────────────────────────────
          Card(
            child: ListTile(
              leading: const Icon(Icons.home_work_outlined),
              title: const Text('Anuncios activos'),
              trailing: Text('$_activeListings',
                  style: const TextStyle(
                      fontSize: 18, fontWeight: FontWeight.w700)),
            ),
          ),
          const SizedBox(height: 16),

          // ── Reviews ─────────────────────────────────────────────
          const Padding(
            padding: EdgeInsets.only(left: 4, bottom: 8),
            child: Text('Reseñas',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
          ),
          if (_reviews.isEmpty)
            Card(
              child: const Padding(
                padding: EdgeInsets.all(16),
                child: Text('Aún no hay reseñas'),
              ),
            )
          else
            ..._reviews.map((r) {
              final review = r as Map<String, dynamic>;
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text((review['reviewerName'] as String?) ?? 'Usuario',
                                style: const TextStyle(
                                    fontWeight: FontWeight.w600)),
                            const Spacer(),
                            _Stars(
                                rating: (review['rating'] as num?)?.toDouble() ??
                                    0.0),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text((review['comment'] as String?) ?? ''),
                      ],
                    ),
                  ),
                ),
              );
            }),

          const SizedBox(height: 16),

          // ── Contact button ──────────────────────────────────────
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Función de contacto próximamente')),
                );
              },
              icon: const Icon(Icons.chat_outlined),
              label: const Text('Contactar'),
            ),
          ),
        ],
      ),
    );
  }
}

class _RatingColumn extends StatelessWidget {
  const _RatingColumn({
    required this.label,
    required this.rating,
    required this.count,
  });
  final String label;
  final double rating;
  final int count;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        _Stars(rating: rating),
        const SizedBox(height: 4),
        Text(rating.toStringAsFixed(1),
            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
        Text('$count reseñas',
            style: TextStyle(color: AppColors.mutedForeground, fontSize: 12)),
        const SizedBox(height: 2),
        Text(label,
            style: TextStyle(color: AppColors.mutedForeground, fontSize: 11)),
      ],
    );
  }
}

class _Stars extends StatelessWidget {
  const _Stars({required this.rating});
  final double rating;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (i) {
        return Icon(
          i < rating.round() ? Icons.star : Icons.star_border,
          size: 16,
          color: AppColors.accent,
        );
      }),
    );
  }
}
