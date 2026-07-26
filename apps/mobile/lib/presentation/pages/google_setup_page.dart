import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_colors.dart';
import '../../data/services/api_client.dart';

/// Profile completion form shown after Google OAuth sign-in.
///
/// Collects phone prefix, phone, cedula type, cedula, and role, then calls
/// `apiClient.updateProfile()` and navigates to the role dashboard.
class GoogleSetupPage extends ConsumerStatefulWidget {
  const GoogleSetupPage({super.key});

  @override
  ConsumerState<GoogleSetupPage> createState() => _GoogleSetupPageState();
}

class _GoogleSetupPageState extends ConsumerState<GoogleSetupPage> {
  final _formKey = GlobalKey<FormState>();
  String _phonePrefix = '+57';
  final _phoneController = TextEditingController();
  String _cedulaType = 'CC';
  final _cedulaController = TextEditingController();
  String _role = 'estudiante';
  bool _submitting = false;

  @override
  void dispose() {
    _phoneController.dispose();
    _cedulaController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _submitting = true);
    try {
      await ref.read(apiClientProvider).updateProfile({
        'phonePrefix': _phonePrefix,
        'phone': _phoneController.text.trim(),
        'cedulaType': _cedulaType,
        'cedula': _cedulaController.text.trim(),
        'role': _role,
      });
      if (!mounted) return;
      // Route to the dashboard matching the chosen role.
      final path = _dashboardPathForRole(_role);
      context.go(path);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No se pudo completar el registro')),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  String _dashboardPathForRole(String role) {
    switch (role) {
      case 'admin':
        return '/admin';
      case 'operator':
        return '/operator';
      case 'propietario':
        return '/propietario';
      case 'cliente':
        return '/cliente';
      case 'estudiante':
      default:
        return '/estudiante';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Completar registro')),
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(
                'Completa tu perfil para continuar',
                style: TextStyle(color: AppColors.mutedForeground, fontSize: 14),
              ),
              const SizedBox(height: 20),

              // ── Phone ───────────────────────────────────────────
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    flex: 2,
                    child: DropdownButtonFormField<String>(
                      initialValue: _phonePrefix,
                      decoration: const InputDecoration(
                        labelText: 'Prefijo',
                        border: OutlineInputBorder(),
                      ),
                      items: const [
                        DropdownMenuItem(value: '+57', child: Text('+57')),
                        DropdownMenuItem(value: '+58', child: Text('+58')),
                        DropdownMenuItem(value: '+593', child: Text('+593')),
                      ],
                      onChanged: (v) => setState(() => _phonePrefix = v ?? '+57'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 3,
                    child: TextFormField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(
                        labelText: 'Teléfono',
                        border: OutlineInputBorder(),
                      ),
                      validator: (v) =>
                          (v == null || v.trim().isEmpty) ? 'Requerido' : null,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // ── Cédula ──────────────────────────────────────────
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    flex: 2,
                    child: DropdownButtonFormField<String>(
                      initialValue: _cedulaType,
                      decoration: const InputDecoration(
                        labelText: 'Tipo',
                        border: OutlineInputBorder(),
                      ),
                      items: const [
                        DropdownMenuItem(value: 'CC', child: Text('CC')),
                        DropdownMenuItem(value: 'CE', child: Text('CE')),
                      ],
                      onChanged: (v) => setState(() => _cedulaType = v ?? 'CC'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 3,
                    child: TextFormField(
                      controller: _cedulaController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Cédula',
                        border: OutlineInputBorder(),
                      ),
                      validator: (v) =>
                          (v == null || v.trim().isEmpty) ? 'Requerido' : null,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // ── Role ────────────────────────────────────────────
              DropdownButtonFormField<String>(
                initialValue: _role,
                decoration: const InputDecoration(
                  labelText: 'Rol',
                  border: OutlineInputBorder(),
                ),
                items: const [
                  DropdownMenuItem(
                      value: 'estudiante', child: Text('Estudiante')),
                  DropdownMenuItem(value: 'cliente', child: Text('Cliente')),
                  DropdownMenuItem(
                      value: 'propietario', child: Text('Propietario')),
                ],
                onChanged: (v) => setState(() => _role = v ?? 'estudiante'),
              ),
              const SizedBox(height: 24),

              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _submitting ? null : _submit,
                  child: _submitting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Completar registro'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
