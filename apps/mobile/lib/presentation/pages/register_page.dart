import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/services/api_client.dart';

/// Registration page with multi-field form.
class RegisterPage extends ConsumerStatefulWidget {
  const RegisterPage({super.key});

  @override
  ConsumerState<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends ConsumerState<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _phoneController = TextEditingController();
  final _cedulaController = TextEditingController();

  String _phonePrefix = '+57';
  String _cedulaType = 'CC';
  String _role = 'cliente';
  bool _isLoading = false;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _phoneController.dispose();
    _cedulaController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    try {
      await ref.read(apiClientProvider).register({
        'name': _nameController.text.trim(),
        'email': _emailController.text.trim(),
        'password': _passwordController.text,
        'phonePrefix': _phonePrefix,
        'phone': _phoneController.text.trim(),
        'cedulaType': _cedulaType,
        'cedula': _cedulaController.text.trim(),
        'role': _role,
      });

      if (mounted) context.go('/verificar-email');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No se pudo registrar el usuario')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Registrarse')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Crea tu cuenta',
                  style: TextStyle(
                    color: colorScheme.onSurface,
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 24),
                // Name
                TextFormField(
                  controller: _nameController,
                  decoration: const InputDecoration(
                    labelText: 'Nombre completo',
                    prefixIcon: Icon(Icons.person_outline),
                    border: OutlineInputBorder(),
                  ),
                  validator: (v) =>
                      (v == null || v.isEmpty) ? 'Ingresa tu nombre' : null,
                ),
                const SizedBox(height: 16),
                // Email
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(
                    labelText: 'Correo electronico',
                    prefixIcon: Icon(Icons.email_outlined),
                    border: OutlineInputBorder(),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Ingresa tu correo';
                    if (!v.contains('@')) return 'Correo invalido';
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                // Password
                TextFormField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  decoration: InputDecoration(
                    labelText: 'Contrasena',
                    prefixIcon: const Icon(Icons.lock_outline),
                    border: const OutlineInputBorder(),
                    suffixIcon: IconButton(
                      icon: Icon(_obscurePassword
                          ? Icons.visibility_outlined
                          : Icons.visibility_off_outlined),
                      onPressed: () => setState(
                          () => _obscurePassword = !_obscurePassword),
                    ),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Ingresa una contrasena';
                    if (v.length < 6) return 'Minimo 6 caracteres';
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                // Confirm password
                TextFormField(
                  controller: _confirmPasswordController,
                  obscureText: _obscurePassword,
                  decoration: const InputDecoration(
                    labelText: 'Confirmar contrasena',
                    prefixIcon: Icon(Icons.lock_outline),
                    border: OutlineInputBorder(),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Confirma tu contrasena';
                    if (v != _passwordController.text) {
                      return 'Las contrasenas no coinciden';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                // Phone prefix + phone
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(
                      width: 110,
                      child: DropdownButtonFormField<String>(
                        initialValue: _phonePrefix,
                        decoration: const InputDecoration(
                          labelText: 'Prefijo',
                          border: OutlineInputBorder(),
                        ),
                        items: const [
                          DropdownMenuItem(
                              value: '+57', child: Text('+57')),
                          DropdownMenuItem(
                              value: '+58', child: Text('+58')),
                        ],
                        onChanged: (v) =>
                            setState(() => _phonePrefix = v ?? '+57'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextFormField(
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                        decoration: const InputDecoration(
                          labelText: 'Telefono',
                          prefixIcon: Icon(Icons.phone_outlined),
                          border: OutlineInputBorder(),
                        ),
                        validator: (v) =>
                            (v == null || v.isEmpty) ? 'Ingresa tu telefono' : null,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                // Cedula type + cedula
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(
                      width: 110,
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
                        onChanged: (v) =>
                            setState(() => _cedulaType = v ?? 'CC'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextFormField(
                        controller: _cedulaController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: 'Cedula',
                          prefixIcon: Icon(Icons.badge_outlined),
                          border: OutlineInputBorder(),
                        ),
                        validator: (v) =>
                            (v == null || v.isEmpty) ? 'Ingresa tu cedula' : null,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                // Role selection
                Text(
                  'Tipo de cuenta',
                  style: TextStyle(
                    color: colorScheme.onSurface,
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  children: [
                    _roleChip('estudiante', 'Estudiante', colorScheme),
                    _roleChip('cliente', 'Cliente', colorScheme),
                    _roleChip('propietario', 'Propietario', colorScheme),
                  ],
                ),
                const SizedBox(height: 24),
                // Submit
                FilledButton(
                  onPressed: _isLoading ? null : _submit,
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Registrarse'),
                ),
                const SizedBox(height: 16),
                // Login link
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Ya tienes cuenta?',
                      style: TextStyle(color: colorScheme.onSurfaceVariant),
                    ),
                    TextButton(
                      onPressed: () => context.go('/login'),
                      child: const Text('Iniciar Sesion'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _roleChip(String value, String label, ColorScheme colorScheme) {
    final selected = _role == value;
    return ChoiceChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => setState(() => _role = value),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      selectedColor: colorScheme.primary,
      labelStyle: TextStyle(
        color: selected ? colorScheme.onPrimary : colorScheme.onSurface,
      ),
    );
  }
}
