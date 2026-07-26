import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_colors.dart';
import '../../data/services/api_client.dart';

/// Dashboard for owner role (propietario).
///
/// Four-tab bottom navigation: Home, Properties, Requests, Profile.
/// A FAB is shown on the Properties tab to create a new listing.
class OwnerDashboardPage extends ConsumerStatefulWidget {
  const OwnerDashboardPage({super.key});

  @override
  ConsumerState<OwnerDashboardPage> createState() => _OwnerDashboardPageState();
}

class _OwnerDashboardPageState extends ConsumerState<OwnerDashboardPage> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_titleForIndex(_currentIndex))),
      body: IndexedStack(
        index: _currentIndex,
        children: const [
          _HomeTab(),
          _PropertiesTab(),
          _RequestsTab(),
          _ProfileTab(),
        ],
      ),
      floatingActionButton: _currentIndex == 1
          ? FloatingActionButton(
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.primaryForeground,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              onPressed: () => context.push('/propiedades/new'),
              child: const Icon(Icons.add),
            )
          : null,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (i) => setState(() => _currentIndex = i),
        type: BottomNavigationBarType.fixed,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.mutedForeground,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'Inicio',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.home_work_outlined),
            activeIcon: Icon(Icons.home_work),
            label: 'Propiedades',
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

  String _titleForIndex(int index) {
    switch (index) {
      case 0:
        return 'Resumen';
      case 1:
        return 'Propiedades';
      case 2:
        return 'Solicitudes';
      case 3:
        return 'Perfil';
      default:
        return 'Ohana';
    }
  }
}

// ── Home tab: stats summary ──────────────────────────────────────────────────

class _HomeTab extends ConsumerStatefulWidget {
  const _HomeTab();

  @override
  ConsumerState<_HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends ConsumerState<_HomeTab> {
  Map<String, dynamic>? _stats;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    setState(() => _loading = true);
    try {
      final res = await ref.read(apiClientProvider).getStatistics();
      setState(() {
        _stats = res.data as Map<String, dynamic>?;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    final s = _stats ?? {};
    return RefreshIndicator(
      onRefresh: _loadStats,
      child: GridView.count(
        padding: const EdgeInsets.all(16),
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 1.4,
        children: [
          _StatCard(
            icon: Icons.home_work_outlined,
            label: 'Propiedades',
            value: '${s['totalProperties'] ?? 0}',
          ),
          _StatCard(
            icon: Icons.visibility_outlined,
            label: 'Anuncios activos',
            value: '${s['activeListings'] ?? 0}',
          ),
          _StatCard(
            icon: Icons.request_quote_outlined,
            label: 'Solicitudes',
            value: '${s['totalRequests'] ?? 0}',
          ),
          _StatCard(
            icon: Icons.attach_money,
            label: 'Ingresos',
            value: '\$${s['revenue'] ?? 0}',
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
  });
  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Icon(icon, color: AppColors.accent),
            Text(value,
                style: const TextStyle(
                    fontSize: 22, fontWeight: FontWeight.w700)),
            Text(label,
                style: TextStyle(color: AppColors.mutedForeground, fontSize: 13)),
          ],
        ),
      ),
    );
  }
}

// ── Properties tab ───────────────────────────────────────────────────────────

class _PropertiesTab extends ConsumerStatefulWidget {
  const _PropertiesTab();

  @override
  ConsumerState<_PropertiesTab> createState() => _PropertiesTabState();
}

class _PropertiesTabState extends ConsumerState<_PropertiesTab> {
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

  Future<void> _deleteProperty(int id) async {
    try {
      await ref.read(apiClientProvider).deleteProperty(id);
      _loadProperties();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No se pudo eliminar la propiedad')),
        );
      }
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
            ElevatedButton(onPressed: _loadProperties, child: const Text('Reintentar')),
          ],
        ),
      );
    }
    if (_properties.isEmpty) {
      return const Center(child: Text('No tienes propiedades publicadas'));
    }
    return RefreshIndicator(
      onRefresh: _loadProperties,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _properties.length,
        itemBuilder: (context, index) {
          final p = _properties[index] as Map<String, dynamic>;
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Card(
              child: ListTile(
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                title: Text((p['title'] as String?) ?? '',
                    style: const TextStyle(fontWeight: FontWeight.w600)),
                subtitle: Text((p['location'] as String?) ?? ''),
                trailing: PopupMenuButton<String>(
                  onSelected: (v) {
                    if (v == 'edit') {
                      context.push('/propiedades/${p['id']}');
                    } else if (v == 'delete') {
                      _deleteProperty(p['id'] as int);
                    }
                  },
                  itemBuilder: (context) => [
                    const PopupMenuItem(value: 'edit', child: Text('Editar')),
                    const PopupMenuItem(
                        value: 'delete',
                        child: Text('Eliminar',
                            style: TextStyle(color: AppColors.destructive))),
                  ],
                ),
                onTap: () => context.push('/propiedades/${p['id']}'),
              ),
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

  Future<void> _respond(int id, bool approve) async {
    try {
      // Endpoint uses generic update; placeholder action.
      await ref.read(apiClientProvider).dio.put('/rent/$id',
          data: {'status': approve ? 'approved' : 'rejected'});
      _loadRequests();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No se pudo actualizar la solicitud')),
        );
      }
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
      return const Center(child: Text('No tienes solicitudes recibidas'));
    }
    return RefreshIndicator(
      onRefresh: _loadRequests,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _requests.length,
        itemBuilder: (context, index) {
          final r = _requests[index] as Map<String, dynamic>;
          final id = r['id'] as int;
          final status = (r['status'] as String?) ?? 'pending';
          final property = r['property'] as Map<String, dynamic>?;
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text((property?['title'] as String?) ?? 'Propiedad',
                        style: const TextStyle(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    _StatusChip(status: status),
                    if (status == 'pending') ...[
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () => _respond(id, false),
                              child: const Text('Rechazar'),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () => _respond(id, true),
                              child: const Text('Aprobar'),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});
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
      child: Text(label,
          style: TextStyle(color: color, fontWeight: FontWeight.w600, fontSize: 12)),
    );
  }
}

// ── Profile tab ──────────────────────────────────────────────────────────────

class _ProfileTab extends ConsumerWidget {
  const _ProfileTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.read(authStateProvider).user;
    final name = (user?['name'] as String?) ?? 'Propietario';
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
                      Text(name,
                          style: const TextStyle(
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
