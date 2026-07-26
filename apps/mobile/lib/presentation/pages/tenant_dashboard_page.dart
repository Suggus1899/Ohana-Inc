import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_colors.dart';
import '../../data/services/api_client.dart';

/// Dashboard for tenant roles (estudiante / cliente).
///
/// Four-tab bottom navigation: Discover, Favorites, Requests, Profile.
class TenantDashboardPage extends ConsumerStatefulWidget {
  const TenantDashboardPage({super.key});

  @override
  ConsumerState<TenantDashboardPage> createState() => _TenantDashboardPageState();
}

class _TenantDashboardPageState extends ConsumerState<TenantDashboardPage> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final user = ref.read(authStateProvider).user;
    final name = (user?['name'] as String?) ?? 'Inquilino';

    return Scaffold(
      appBar: AppBar(
        title: Text(_titleForIndex(_currentIndex, name)),
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: const [
          _DiscoverTab(),
          _FavoritesTab(),
          _RequestsTab(),
          _ProfileTab(),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (i) => setState(() => _currentIndex = i),
        type: BottomNavigationBarType.fixed,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.mutedForeground,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.explore_outlined),
            activeIcon: Icon(Icons.explore),
            label: 'Descubrir',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.favorite_border),
            activeIcon: Icon(Icons.favorite),
            label: 'Favoritos',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.request_quote_outlined),
            activeIcon: Icon(Icons.request_quote),
            label: 'Solicitudes',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'Perfil',
          ),
        ],
      ),
    );
  }

  String _titleForIndex(int index, String name) {
    switch (index) {
      case 0:
        return 'Descubrir';
      case 1:
        return 'Favoritos';
      case 2:
        return 'Solicitudes';
      case 3:
        return name;
      default:
        return 'Ohana';
    }
  }
}

// ── Discover tab ─────────────────────────────────────────────────────────────

class _DiscoverTab extends ConsumerStatefulWidget {
  const _DiscoverTab();

  @override
  ConsumerState<_DiscoverTab> createState() => _DiscoverTabState();
}

class _DiscoverTabState extends ConsumerState<_DiscoverTab> {
  List<dynamic> _properties = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadProperties();
  }

  Future<void> _loadProperties() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await ref.read(apiClientProvider).getProperties();
      final data = res.data['data'] as List?;
      setState(() {
        _properties = data ?? [];
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'No se pudieron cargar las propiedades';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(_error!),
            const SizedBox(height: 12),
            ElevatedButton(onPressed: _loadProperties, child: const Text('Reintentar')),
          ],
        ),
      );
    }
    if (_properties.isEmpty) {
      return const Center(child: Text('No hay propiedades disponibles'));
    }
    return RefreshIndicator(
      onRefresh: _loadProperties,
      child: GridView.builder(
        padding: const EdgeInsets.all(16),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 0.72,
        ),
        itemCount: _properties.length,
        itemBuilder: (context, index) {
          final p = _properties[index] as Map<String, dynamic>;
          return _PropertyCard(
            id: p['id'] as int,
            title: (p['title'] as String?) ?? '',
            price: (p['price'] as num?)?.toDouble() ?? 0,
            location: (p['location'] as String?) ?? '',
            imageUrl: p['mainImage'] as String?,
          );
        },
      ),
    );
  }
}

class _PropertyCard extends StatelessWidget {
  const _PropertyCard({
    required this.id,
    required this.title,
    required this.price,
    required this.location,
    required this.imageUrl,
  });

  final int id;
  final String title;
  final double price;
  final String location;
  final String? imageUrl;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/propiedades/$id'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Container(
                color: AppColors.muted,
                width: double.infinity,
                child: imageUrl != null
                    ? Image.network(imageUrl!, fit: BoxFit.cover)
                    : const Icon(Icons.home_work_outlined,
                        size: 48, color: AppColors.mutedForeground),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '\$${price.toStringAsFixed(0)}',
                    style: TextStyle(
                      color: AppColors.accent,
                      fontWeight: FontWeight.w700,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      Icon(Icons.location_on_outlined,
                          size: 12, color: AppColors.mutedForeground),
                      const SizedBox(width: 2),
                      Expanded(
                        child: Text(
                          location,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 12,
                            color: AppColors.mutedForeground,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Favorites tab ────────────────────────────────────────────────────────────

class _FavoritesTab extends ConsumerStatefulWidget {
  const _FavoritesTab();

  @override
  ConsumerState<_FavoritesTab> createState() => _FavoritesTabState();
}

class _FavoritesTabState extends ConsumerState<_FavoritesTab> {
  List<dynamic> _favorites = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadFavorites();
  }

  Future<void> _loadFavorites() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await ref.read(apiClientProvider).getFavorites();
      final data = res.data['data'] as List?;
      setState(() {
        _favorites = data ?? [];
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'No se pudieron cargar los favoritos';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_error != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(_error!),
            const SizedBox(height: 12),
            ElevatedButton(onPressed: _loadFavorites, child: const Text('Reintentar')),
          ],
        ),
      );
    }
    if (_favorites.isEmpty) {
      return const Center(child: Text('Aún no tienes favoritos'));
    }
    return RefreshIndicator(
      onRefresh: _loadFavorites,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _favorites.length,
        itemBuilder: (context, index) {
          final f = _favorites[index] as Map<String, dynamic>;
          final property = f['property'] as Map<String, dynamic>? ?? f;
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _PropertyCard(
              id: property['id'] as int,
              title: (property['title'] as String?) ?? '',
              price: (property['price'] as num?)?.toDouble() ?? 0,
              location: (property['location'] as String?) ?? '',
              imageUrl: property['mainImage'] as String?,
            ),
          );
        },
      ),
    );
  }
}

// ── Requests tab ─────────────────────────────────────────────────────────────

class _RequestsTab extends ConsumerStatefulWidget {
  const _RequestsTab();

  @override
  ConsumerState<_RequestsTab> createState() => _RequestsTabState();
}

class _RequestsTabState extends ConsumerState<_RequestsTab> {
  List<dynamic> _requests = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadRequests();
  }

  Future<void> _loadRequests() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await ref.read(apiClientProvider).getRentRequests();
      final data = res.data['data'] as List?;
      setState(() {
        _requests = data ?? [];
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'No se pudieron cargar las solicitudes';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_error != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(_error!),
            const SizedBox(height: 12),
            ElevatedButton(onPressed: _loadRequests, child: const Text('Reintentar')),
          ],
        ),
      );
    }
    if (_requests.isEmpty) {
      return const Center(child: Text('No tienes solicitudes de arriendo'));
    }
    return RefreshIndicator(
      onRefresh: _loadRequests,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _requests.length,
        itemBuilder: (context, index) {
          final r = _requests[index] as Map<String, dynamic>;
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _RequestTile(request: r),
          );
        },
      ),
    );
  }
}

class _RequestTile extends StatelessWidget {
  const _RequestTile({required this.request});
  final Map<String, dynamic> request;

  @override
  Widget build(BuildContext context) {
    final status = (request['status'] as String?) ?? 'pending';
    final property = request['property'] as Map<String, dynamic>?;
    final title = (property?['title'] as String?) ?? 'Propiedad';
    return Card(
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 6),
          child: Row(
            children: [
              _StatusBadge(status: status),
            ],
          ),
        ),
        trailing: const Icon(Icons.chevron_right, color: AppColors.mutedForeground),
        onTap: () {},
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});
  final String status;

  @override
  Widget build(BuildContext context) {
    Color color;
    String label;
    switch (status) {
      case 'approved':
        color = AppColors.accent;
        label = 'Aprobada';
        break;
      case 'rejected':
        color = AppColors.destructive;
        label = 'Rechazada';
        break;
      case 'pending':
      default:
        color = AppColors.mutedForeground;
        label = 'Pendiente';
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        label,
        style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600),
      ),
    );
  }
}

// ── Profile tab ──────────────────────────────────────────────────────────────

class _ProfileTab extends ConsumerWidget {
  const _ProfileTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.read(authStateProvider).user;
    final name = (user?['name'] as String?) ?? 'Usuario';
    final email = (user?['email'] as String?) ?? '';
    final photo = user?['profilePhotoUrl'] as String?;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: AppColors.muted,
                  backgroundImage: photo != null ? NetworkImage(photo) : null,
                  child: photo == null
                      ? const Icon(Icons.person, color: AppColors.mutedForeground)
                      : null,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(name, style: const TextStyle(
                          fontSize: 16, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 2),
                      Text(email,
                          style: TextStyle(color: AppColors.mutedForeground)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Card(
          child: Column(
            children: [
              ListTile(
                leading: const Icon(Icons.person_outline),
                title: const Text('Mi perfil'),
                trailing: const Icon(Icons.chevron_right,
                    color: AppColors.mutedForeground),
                onTap: () => context.push('/perfil'),
              ),
              ListTile(
                leading: const Icon(Icons.settings_outlined),
                title: const Text('Configuración'),
                trailing: const Icon(Icons.chevron_right,
                    color: AppColors.mutedForeground),
                onTap: () => context.push('/perfil'),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
