import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/responsive.dart';
import '../../data/services/api_client.dart';
import '../widgets/demo_mode_banner.dart';
import '../widgets/ohana_logo.dart';

/// Dashboard for admin role.
///
/// Five-tab bottom navigation: Home, Users, KYC, Reports, Settings.
class AdminDashboardPage extends ConsumerStatefulWidget {
  const AdminDashboardPage({super.key});

  @override
  ConsumerState<AdminDashboardPage> createState() => _AdminDashboardPageState();
}

class _AdminDashboardPageState extends ConsumerState<AdminDashboardPage> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const OhanaLogo(size: 22, showWordmark: false),
            const SizedBox(width: 8),
            Text(_titleForIndex(_currentIndex)),
          ],
        ),
      ),
      body: Column(
        children: [
          const DemoModeBanner(),
          Expanded(
            child: IndexedStack(
              index: _currentIndex,
              children: const [
                _HomeTab(),
                _UsersTab(),
                _KycTab(),
                _ReportsTab(),
                _SettingsTab(),
              ],
            ),
          ),
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
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'Inicio',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.people_outline),
            activeIcon: Icon(Icons.people),
            label: 'Usuarios',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.verified_user_outlined),
            activeIcon: Icon(Icons.verified_user),
            label: 'KYC',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.report_outlined),
            activeIcon: Icon(Icons.report),
            label: 'Reportes',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.settings_outlined),
            activeIcon: Icon(Icons.settings),
            label: 'Ajustes',
          ),
        ],
      ),
    );
  }

  String _titleForIndex(int index) {
    switch (index) {
      case 0:
        return 'Plataforma';
      case 1:
        return 'Usuarios';
      case 2:
        return 'Verificaciones KYC';
      case 3:
        return 'Reportes';
      case 4:
        return 'Ajustes';
      default:
        return 'Ohana Admin';
    }
  }
}

// ── Home tab: platform stats ─────────────────────────────────────────────────

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
    final bp = ResponsiveBreakpoint.of(context);
    return RefreshIndicator(
      onRefresh: _loadStats,
      child: GridView.count(
        padding: EdgeInsets.all(bp.horizontalPadding),
        crossAxisCount: bp.gridColumns,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 1.4,
        children: [
          _StatCard(
              icon: Icons.people_outline,
              label: 'Usuarios',
              value: '${s['totalUsers'] ?? 0}'),
          _StatCard(
              icon: Icons.home_work_outlined,
              label: 'Propiedades',
              value: '${s['totalProperties'] ?? 0}'),
          _StatCard(
              icon: Icons.attach_money,
              label: 'Ingresos',
              value: '\$${s['revenue'] ?? 0}'),
          _StatCard(
              icon: Icons.visibility_outlined,
              label: 'Anuncios activos',
              value: '${s['activeListings'] ?? 0}'),
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
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
            Text(label,
                style: TextStyle(color: AppColors.mutedForeground, fontSize: 13)),
          ],
        ),
      ),
    );
  }
}

// ── Users tab ────────────────────────────────────────────────────────────────

class _UsersTab extends ConsumerStatefulWidget {
  const _UsersTab();

  @override
  ConsumerState<_UsersTab> createState() => _UsersTabState();
}

class _UsersTabState extends ConsumerState<_UsersTab> {
  List<dynamic> _users = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadUsers();
  }

  Future<void> _loadUsers() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await ref.read(apiClientProvider).getUsers();
      final data = res.data['data'] as List?;
      setState(() {
        _users = data ?? [];
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'No se pudieron cargar los usuarios';
        _loading = false;
      });
    }
  }

  Future<void> _setStatus(int id, String status) async {
    try {
      await ref.read(apiClientProvider).updateUserStatus(id, status);
      _loadUsers();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No se pudo actualizar el estado')),
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
            ElevatedButton(onPressed: _loadUsers, child: const Text('Reintentar')),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _loadUsers,
      child: ListView.builder(
        padding: EdgeInsets.all(ResponsiveBreakpoint.of(context).horizontalPadding),
        itemCount: _users.length,
        itemBuilder: (context, index) {
          final u = _users[index] as Map<String, dynamic>;
          final id = u['id'] as int;
          final status = (u['accountStatus'] as String?) ?? 'pending';
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Card(
              child: ListTile(
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                title: Text((u['name'] as String?) ?? '',
                    style: const TextStyle(fontWeight: FontWeight.w600)),
                subtitle: Text((u['email'] as String?) ?? ''),
                trailing: PopupMenuButton<String>(
                  onSelected: (v) => _setStatus(id, v),
                  itemBuilder: (context) => [
                    const PopupMenuItem(value: 'active', child: Text('Activar')),
                    const PopupMenuItem(value: 'suspended', child: Text('Suspender')),
                  ],
                  child: _StatusChip(status: status),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

// ── KYC tab ──────────────────────────────────────────────────────────────────

class _KycTab extends ConsumerStatefulWidget {
  const _KycTab();

  @override
  ConsumerState<_KycTab> createState() => _KycTabState();
}

class _KycTabState extends ConsumerState<_KycTab> {
  List<dynamic> _verifications = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadVerifications();
  }

  Future<void> _loadVerifications() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await ref.read(apiClientProvider).getKycVerifications();
      final data = res.data['data'] as List?;
      setState(() {
        _verifications = data ?? [];
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'No se pudieron cargar las verificaciones';
        _loading = false;
      });
    }
  }

  Future<void> _approve(int id) async {
    try {
      await ref.read(apiClientProvider).approveKyc(id);
      _loadVerifications();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No se pudo aprobar la verificación')),
        );
      }
    }
  }

  Future<void> _reject(int id) async {
    try {
      await ref.read(apiClientProvider).rejectKyc(id, 'Rechazado por administrador');
      _loadVerifications();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No se pudo rechazar la verificación')),
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
            ElevatedButton(onPressed: _loadVerifications, child: const Text('Reintentar')),
          ],
        ),
      );
    }
    if (_verifications.isEmpty) {
      return const Center(child: Text('No hay verificaciones pendientes'));
    }
    return RefreshIndicator(
      onRefresh: _loadVerifications,
      child: ListView.builder(
        padding: EdgeInsets.all(ResponsiveBreakpoint.of(context).horizontalPadding),
        itemCount: _verifications.length,
        itemBuilder: (context, index) {
          final v = _verifications[index] as Map<String, dynamic>;
          final id = v['id'] as int;
          final user = v['user'] as Map<String, dynamic>?;
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text((user?['name'] as String?) ?? 'Usuario',
                        style: const TextStyle(fontWeight: FontWeight.w600)),
                    Text((user?['email'] as String?) ?? '',
                        style: TextStyle(color: AppColors.mutedForeground)),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () => _reject(id),
                            child: const Text('Rechazar'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () => _approve(id),
                            child: const Text('Aprobar'),
                          ),
                        ),
                      ],
                    ),
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

// ── Reports tab ──────────────────────────────────────────────────────────────

class _ReportsTab extends ConsumerStatefulWidget {
  const _ReportsTab();

  @override
  ConsumerState<_ReportsTab> createState() => _ReportsTabState();
}

class _ReportsTabState extends ConsumerState<_ReportsTab> {
  List<dynamic> _reports = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadReports();
  }

  Future<void> _loadReports() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await ref.read(apiClientProvider).getReports();
      final data = res.data['data'] as List?;
      setState(() {
        _reports = data ?? [];
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'No se pudieron cargar los reportes';
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
            ElevatedButton(onPressed: _loadReports, child: const Text('Reintentar')),
          ],
        ),
      );
    }
    if (_reports.isEmpty) {
      return const Center(child: Text('No hay reportes'));
    }
    return RefreshIndicator(
      onRefresh: _loadReports,
      child: ListView.builder(
        padding: EdgeInsets.all(ResponsiveBreakpoint.of(context).horizontalPadding),
        itemCount: _reports.length,
        itemBuilder: (context, index) {
          final r = _reports[index] as Map<String, dynamic>;
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Card(
              child: ListTile(
                title: Text((r['reason'] as String?) ?? 'Reporte',
                    style: const TextStyle(fontWeight: FontWeight.w600)),
                subtitle: Text((r['description'] as String?) ?? ''),
                trailing: const Icon(Icons.chevron_right,
                    color: AppColors.mutedForeground),
                onTap: () {},
              ),
            ),
          );
        },
      ),
    );
  }
}

// ── Settings tab ─────────────────────────────────────────────────────────────

class _SettingsTab extends ConsumerStatefulWidget {
  const _SettingsTab();

  @override
  ConsumerState<_SettingsTab> createState() => _SettingsTabState();
}

class _SettingsTabState extends ConsumerState<_SettingsTab> {
  Map<String, dynamic>? _settings;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    setState(() => _loading = true);
    try {
      final res = await ref.read(apiClientProvider).getSettings();
      setState(() {
        _settings = res.data as Map<String, dynamic>?;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: ListTile(
            leading: const Icon(Icons.person_outline),
            title: const Text('Mi perfil'),
            trailing: const Icon(Icons.chevron_right,
                color: AppColors.mutedForeground),
            onTap: () => context.push('/perfil'),
          ),
        ),
        const SizedBox(height: 12),
        Card(
          child: Column(
            children: [
              SwitchListTile(
                title: const Text('Notificaciones'),
                value: (_settings?['notifications'] as bool?) ?? true,
                onChanged: (v) => setState(() => _settings?['notifications'] = v),
              ),
              SwitchListTile(
                title: const Text('Modo mantenimiento'),
                value: (_settings?['maintenance'] as bool?) ?? false,
                onChanged: (v) => setState(() => _settings?['maintenance'] = v),
              ),
            ],
          ),
        ),
      ],
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
      case 'active':
        color = AppColors.accent;
        label = 'Activo';
        break;
      case 'suspended':
        color = AppColors.destructive;
        label = 'Suspendido';
        break;
      case 'rejected':
        color = AppColors.destructive;
        label = 'Rechazado';
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
