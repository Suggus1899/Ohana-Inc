import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_colors.dart';
import '../../data/services/api_client.dart';

/// Current user profile page.
///
/// Shows profile photo, name, email, verification badge, phone and cedula,
/// an edit button, a settings section, and a logout button.
class ProfilePage extends ConsumerStatefulWidget {
  const ProfilePage({super.key});

  @override
  ConsumerState<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends ConsumerState<ProfilePage> {
  Map<String, dynamic>? _profile;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      // Prefer the auth state user, then refresh from the API.
      final authUser = ref.read(authStateProvider).user;
      final res = await ref.read(apiClientProvider).getProfile();
      final data = res.data['data'] as Map<String, dynamic>? ?? res.data;
      setState(() {
        _profile = data ?? authUser;
        _loading = false;
      });
    } catch (e) {
      final authUser = ref.read(authStateProvider).user;
      setState(() {
        _profile = authUser;
        _error = authUser == null ? 'No se pudo cargar el perfil' : null;
        _loading = false;
      });
    }
  }

  void _logout() {
    ref.read(authStateProvider.notifier).logout();
    if (mounted) {
      context.go('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Mi perfil')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    if (_error != null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Mi perfil')),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(_error!),
              const SizedBox(height: 12),
              ElevatedButton(onPressed: _loadProfile, child: const Text('Reintentar')),
            ],
          ),
        ),
      );
    }

    final p = _profile ?? {};
    final name = (p['name'] as String?) ?? 'Usuario';
    final email = (p['email'] as String?) ?? '';
    final phonePrefix = (p['phonePrefix'] as String?) ?? '+57';
    final phone = (p['phone'] as String?) ?? '';
    final cedulaType = (p['cedulaType'] as String?) ?? '';
    final cedula = (p['cedula'] as String?) ?? '';
    final isVerified = (p['isVerified'] as bool?) ?? false;
    final photo = p['profilePhotoUrl'] as String?;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mi perfil'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            tooltip: 'Editar perfil',
            onPressed: () => context.push('/perfil'),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // ── Identity card ───────────────────────────────────────
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
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Flexible(
                        child: Text(name,
                            style: const TextStyle(
                                fontSize: 18, fontWeight: FontWeight.w700)),
                      ),
                      if (isVerified) ...[
                        const SizedBox(width: 6),
                        Icon(Icons.verified, color: AppColors.accent, size: 18),
                      ],
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(email,
                      style: TextStyle(color: AppColors.mutedForeground)),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () => context.push('/perfil'),
                      icon: const Icon(Icons.edit_outlined),
                      label: const Text('Editar perfil'),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // ── Contact info ────────────────────────────────────────
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.phone_outlined),
                  title: const Text('Teléfono'),
                  subtitle: Text(phone.isEmpty ? 'No registrado' : '$phonePrefix $phone'),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.badge_outlined),
                  title: const Text('Cédula'),
                  subtitle: Text(cedula.isEmpty
                      ? 'No registrada'
                      : '$cedulaType $cedula'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // ── Settings section ────────────────────────────────────
          const Padding(
            padding: EdgeInsets.only(left: 4, bottom: 8),
            child: Text('Configuración',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
          ),
          Card(
            child: Column(
              children: [
                SwitchListTile(
                  title: const Text('Notificaciones'),
                  secondary: const Icon(Icons.notifications_outlined),
                  value: true,
                  onChanged: (v) {},
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.dark_mode_outlined),
                  title: const Text('Tema'),
                  subtitle: const Text('Claro'),
                  trailing: const Icon(Icons.chevron_right,
                      color: AppColors.mutedForeground),
                  onTap: () {},
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.language_outlined),
                  title: const Text('Idioma'),
                  subtitle: const Text('Español'),
                  trailing: const Icon(Icons.chevron_right,
                      color: AppColors.mutedForeground),
                  onTap: () {},
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // ── Logout ──────────────────────────────────────────────
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.destructive,
                side: BorderSide(color: AppColors.destructive.withValues(alpha: 0.4)),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              onPressed: _logout,
              icon: const Icon(Icons.logout),
              label: const Text('Cerrar sesión'),
            ),
          ),
        ],
      ),
    );
  }
}
