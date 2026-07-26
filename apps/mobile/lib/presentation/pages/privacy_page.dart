import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Privacy policy page with scrollable Spanish placeholder text.
class PrivacyPage extends ConsumerWidget {
  const PrivacyPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Politica de privacidad')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Politica de privacidad',
                style: TextStyle(
                  color: colorScheme.onSurface,
                  fontSize: 24,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'En Ohana valoramos tu privacidad. Esta politica describe como '
                'recopilamos, usamos y protegemos tu informacion personal cuando '
                'utilizas nuestra plataforma de alquileres en Colombia.',
                style: TextStyle(
                  color: colorScheme.onSurfaceVariant,
                  fontSize: 14,
                  height: 1.6,
                ),
              ),
              const SizedBox(height: 16),
              _SectionTitle(title: '1. Datos que recopilamos', colorScheme: colorScheme),
              _BodyText(
                text: 'Recopilamos la informacion que nos proporcionas al '
                    'registrarte: nombre, correo electronico, telefono, documento '
                    'de identidad y datos de tu propiedad. Tambien recopilamos '
                    'datos de uso para mejorar la plataforma.',
                colorScheme: colorScheme,
              ),
              const SizedBox(height: 16),
              _SectionTitle(title: '2. Uso de la informacion', colorScheme: colorScheme),
              _BodyText(
                text: 'Utilizamos tu informacion para verificar tu identidad, '
                    'facilitar transacciones de arrendamiento, mostrar propiedades '
                    'relevantes y comunicarnos contigo sobre tu cuenta.',
                colorScheme: colorScheme,
              ),
              const SizedBox(height: 16),
              _SectionTitle(title: '3. Proteccion de datos', colorScheme: colorScheme),
              _BodyText(
                text: 'Aplicamos medidas de seguridad tecnicas y organizativas '
                    'para proteger tus datos. Tu contrasena se almacena de forma '
                    'encriptada y nunca se comparte con terceros.',
                colorScheme: colorScheme,
              ),
              const SizedBox(height: 16),
              _SectionTitle(title: '4. Comparticion con terceros', colorScheme: colorScheme),
              _BodyText(
                text: 'No vendemos tus datos personales. Solo compartimos '
                    'informacion necesaria con proveedores de pagos y servicios '
                    'de verificacion, bajo estrictos acuerdos de confidencialidad.',
                colorScheme: colorScheme,
              ),
              const SizedBox(height: 16),
              _SectionTitle(title: '5. Tus derechos', colorScheme: colorScheme),
              _BodyText(
                text: 'Tienes derecho a acceder, corregir o eliminar tus datos '
                    'personales. Puedes ejercer estos derechos desde tu perfil o '
                    'contactando a nuestro equipo de soporte.',
                colorScheme: colorScheme,
              ),
              const SizedBox(height: 16),
              _SectionTitle(title: '6. Cookies y rastreo', colorScheme: colorScheme),
              _BodyText(
                text: 'Utilizamos tecnologias de seguimiento para mejorar tu '
                    'experiencia y analizar el uso de la plataforma. Puedes '
                    'gestionar tus preferencias en la configuracion.',
                colorScheme: colorScheme,
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title, required this.colorScheme});

  final String title;
  final ColorScheme colorScheme;

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: TextStyle(
        color: colorScheme.onSurface,
        fontSize: 16,
        fontWeight: FontWeight.w600,
      ),
    );
  }
}

class _BodyText extends StatelessWidget {
  const _BodyText({required this.text, required this.colorScheme});

  final String text;
  final ColorScheme colorScheme;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Text(
        text,
        style: TextStyle(
          color: colorScheme.onSurfaceVariant,
          fontSize: 14,
          height: 1.6,
        ),
      ),
    );
  }
}
