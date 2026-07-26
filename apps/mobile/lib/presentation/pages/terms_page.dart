import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Terms of service page with scrollable Spanish placeholder text.
class TermsPage extends ConsumerWidget {
  const TermsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Terminos de servicio')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Terminos de servicio',
                style: TextStyle(
                  color: colorScheme.onSurface,
                  fontSize: 24,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Bienvenido a Ohana. Al usar nuestra plataforma de alquileres '
                'y arrendamientos en Colombia, aceptas los siguientes terminos. '
                'Ohana actua como intermediario entre propietarios y arrendatarios, '
                'facilitando la publicacion, busqueda y gestion de propiedades.',
                style: TextStyle(
                  color: colorScheme.onSurfaceVariant,
                  fontSize: 14,
                  height: 1.6,
                ),
              ),
              const SizedBox(height: 16),
              _SectionTitle(title: '1. Aceptacion de terminos', colorScheme: colorScheme),
              _BodyText(
                text: 'Al registrarte y utilizar los servicios de Ohana, aceptas '
                    'estar sujeto a estos terminos y a nuestra politica de '
                    'privacidad. Si no estas de acuerdo, no debes usar la plataforma.',
                colorScheme: colorScheme,
              ),
              const SizedBox(height: 16),
              _SectionTitle(title: '2. Registro de usuarios', colorScheme: colorScheme),
              _BodyText(
                text: 'Debes proporcionar informacion veraz al registrarte, '
                    'incluyendo tu nombre, correo, telefono y documento de '
                    'identidad. Eres responsable de mantener la confidencialidad '
                    'de tu cuenta.',
                colorScheme: colorScheme,
              ),
              const SizedBox(height: 16),
              _SectionTitle(title: '3. Publicacion de propiedades', colorScheme: colorScheme),
              _BodyText(
                text: 'Los propietarios deben publicar propiedades reales, '
                    'verificables y con informacion precisa. Ohana se reserva el '
                    'derecho de verificar o eliminar publicaciones que no cumplan '
                    'con las normas.',
                colorScheme: colorScheme,
              ),
              const SizedBox(height: 16),
              _SectionTitle(title: '4. Pagos y transacciones', colorScheme: colorScheme),
              _BodyText(
                text: 'Los pagos se procesan a traves de metodos autorizados por '
                    'Ohana. Las tarifas y comisiones aplicables se informaran '
                    'antes de cada transaccion.',
                colorScheme: colorScheme,
              ),
              const SizedBox(height: 16),
              _SectionTitle(title: '5. Responsabilidad', colorScheme: colorScheme),
              _BodyText(
                text: 'Ohana no es responsable del contenido publicado por los '
                    'usuarios ni de disputas entre propietarios y arrendatarios. '
                    'Facilitamos herramientas para la resolucion de conflictos.',
                colorScheme: colorScheme,
              ),
              const SizedBox(height: 16),
              _SectionTitle(title: '6. Modificaciones', colorScheme: colorScheme),
              _BodyText(
                text: 'Ohana puede modificar estos terminos en cualquier momento. '
                    'Los cambios seran notificados a los usuarios y publicados en '
                    'esta pagina.',
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
