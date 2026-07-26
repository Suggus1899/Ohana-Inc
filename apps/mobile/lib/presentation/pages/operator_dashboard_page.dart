import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_colors.dart';
import '../../data/services/api_client.dart';

/// Dashboard for operator role.
///
/// Four-tab bottom navigation: Verifications, Content Review,
/// User Management, Audit.
class OperatorDashboardPage extends ConsumerStatefulWidget {
  const OperatorDashboardPage({super.key});

  @override
  ConsumerState<OperatorDashboardPage> createState() =>
      _OperatorDashboardPageState();
}

class _OperatorDashboardPageState extends ConsumerState<OperatorDashboardPage> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_titleForIndex(_currentIndex))),
      body: IndexedStack(
        index: _currentIndex,
        children: const [
          _VerificationsTab(),
          _ContentReviewTab(),
          _UserManagementTab(),
          _AuditTab(),
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
            icon: Icon(Icons.verified_user_outlined),
            activeIcon: Icon(Icons.verified_user),
            label: 'Verificaciones',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.fact_check_outlined),
            activeIcon: Icon(Icons.fact_check),
            label: 'Contenido',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.people_outline),
            activeIcon: Icon(Icons.people),
            label: 'Usuarios',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.history_outlined),
            activeIcon: Icon(Icons.history),
            label: 'Auditoría',
          ),
        ],
      ),
    );
  }

  String _titleForIndex(int index) {
    switch (index) {
      case 0:
        return 'Verificaciones KYC';
      case 1:
        return 'Revisión de contenido';
      case 2:
        return 'Gestión de usuarios';
      case 3:
        return 'Registro de auditoría';
      default:
        return 'Ohana Operador';
    }
  }
}

// ── Verifications tab ────────────────────────────────────────────────────────

class _VerificationsTab extends ConsumerStatefulWidget {
  const _VerificationsTab();

  @override
  ConsumerState<_VerificationsTab> createState() => _VerificationsTabState();
}

class _VerificationsTabState extends ConsumerState<_VerificationsTab> {
  List<dynamic> _queue = [];
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
      final res = await ref.read(apiClientProvider).getKycVerifications();
      final data = res.data['data'] as List?;
      setState(() {
        _queue = data ?? [];
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'No se pudo cargar la cola de verificación';
        _loading = false;
      });
    }
  }

  Future<void> _approve(int id) async {
    try {
      await ref.read(apiClientProvider).approveKyc(id);
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No se pudo aprobar')),
        );
      }
    }
  }

  Future<void> _reject(int id) async {
    try {
      await ref.read(apiClientProvider).rejectKyc(id, 'Rechazado por operador');
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No se pudo rechazar')),
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
            ElevatedButton(onPressed: _load, child: const Text('Reintentar')),
          ],
        ),
      );
    }
    if (_queue.isEmpty) {
      return const Center(child: Text('No hay verificaciones pendientes'));
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _queue.length,
        itemBuilder: (context, index) {
          final v = _queue[index] as Map<String, dynamic>;
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

// ── Content review tab ───────────────────────────────────────────────────────

class _ContentReviewTab extends ConsumerStatefulWidget {
  const _ContentReviewTab();

  @override
  ConsumerState<_ContentReviewTab> createState() => _ContentReviewTabState();
}

class _ContentReviewTabState extends ConsumerState<_ContentReviewTab> {
  List<dynamic> _items = [];
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
      // Reuse properties endpoint as the moderation queue placeholder.
      final res = await ref.read(apiClientProvider).getProperties();
      final data = res.data['data'] as List?;
      setState(() {
        _items = data ?? [];
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'No se pudo cargar el contenido';
        _loading = false;
      });
    }
  }

  Future<void> _moderate(int id, bool approve) async {
    try {
      await ref.read(apiClientProvider).updateProperty(
          id, {'isActive': approve});
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No se pudo moderar el contenido')),
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
            ElevatedButton(onPressed: _load, child: const Text('Reintentar')),
          ],
        ),
      );
    }
    if (_items.isEmpty) {
      return const Center(child: Text('No hay contenido para revisar'));
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _items.length,
        itemBuilder: (context, index) {
          final p = _items[index] as Map<String, dynamic>;
          final id = p['id'] as int;
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text((p['title'] as String?) ?? '',
                        style: const TextStyle(fontWeight: FontWeight.w600)),
                    Text((p['location'] as String?) ?? '',
                        style: TextStyle(color: AppColors.mutedForeground)),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () => _moderate(id, false),
                            child: const Text('Ocultar'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () => _moderate(id, true),
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

// ── User management tab ──────────────────────────────────────────────────────

class _UserManagementTab extends ConsumerStatefulWidget {
  const _UserManagementTab();

  @override
  ConsumerState<_UserManagementTab> createState() => _UserManagementTabState();
}

class _UserManagementTabState extends ConsumerState<_UserManagementTab> {
  List<dynamic> _reports = [];
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
      final res = await ref.read(apiClientProvider).getReports();
      final data = res.data['data'] as List?;
      setState(() {
        _reports = data ?? [];
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'No se pudieron cargar los reportes de usuarios';
        _loading = false;
      });
    }
  }

  Future<void> _setStatus(int userId, String status) async {
    try {
      await ref.read(apiClientProvider).updateUserStatus(userId, status);
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No se pudo actualizar el usuario')),
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
            ElevatedButton(onPressed: _load, child: const Text('Reintentar')),
          ],
        ),
      );
    }
    if (_reports.isEmpty) {
      return const Center(child: Text('No hay reportes de usuarios'));
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _reports.length,
        itemBuilder: (context, index) {
          final r = _reports[index] as Map<String, dynamic>;
          final reportedUser = r['reportedUser'] as Map<String, dynamic>?;
          final userId = reportedUser?['id'] as int?;
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Card(
              child: ListTile(
                title: Text((reportedUser?['name'] as String?) ?? 'Usuario',
                    style: const TextStyle(fontWeight: FontWeight.w600)),
                subtitle: Text((r['reason'] as String?) ?? ''),
                trailing: PopupMenuButton<String>(
                  onSelected: (v) {
                    if (userId != null) _setStatus(userId, v);
                  },
                  itemBuilder: (context) => [
                    const PopupMenuItem(value: 'active', child: Text('Activar')),
                    const PopupMenuItem(value: 'suspended', child: Text('Suspender')),
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

// ── Audit tab ────────────────────────────────────────────────────────────────

class _AuditTab extends ConsumerStatefulWidget {
  const _AuditTab();

  @override
  ConsumerState<_AuditTab> createState() => _AuditTabState();
}

class _AuditTabState extends ConsumerState<_AuditTab> {
  List<dynamic> _logs = [];
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
      final res = await ref.read(apiClientProvider).getAnalytics();
      final data = res.data['auditLogs'] as List?;
      setState(() {
        _logs = data ?? [];
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'No se pudo cargar el registro de auditoría';
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
            ElevatedButton(onPressed: _load, child: const Text('Reintentar')),
          ],
        ),
      );
    }
    if (_logs.isEmpty) {
      return const Center(child: Text('No hay registros de auditoría'));
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _logs.length,
        itemBuilder: (context, index) {
          final log = _logs[index] as Map<String, dynamic>;
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Card(
              child: ListTile(
                title: Text((log['action'] as String?) ?? 'Acción',
                    style: const TextStyle(fontWeight: FontWeight.w600)),
                subtitle: Text((log['createdAt'] as String?) ?? ''),
                trailing: Text((log['actor'] as String?) ?? '',
                    style: TextStyle(color: AppColors.mutedForeground)),
              ),
            ),
          );
        },
      ),
    );
  }
}
