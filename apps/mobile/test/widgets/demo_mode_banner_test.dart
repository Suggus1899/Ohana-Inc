import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:ohana_mobile/data/services/demo_data.dart';
import 'package:ohana_mobile/presentation/widgets/demo_mode_banner.dart';

/// Tests for DemoModeBanner — the amber banner shown when Demo Mode is active.
///
/// Verifies that the banner appears/hides based on demo mode state,
/// shows the correct message, and supports dismissal.
void main() {
  // Demo mode is a global mutable flag in demo_data.dart.
  // We must reset it after each test to avoid cross-test contamination.
  tearDown(() {
    setDemoModeEnabled(false);
  });

  testWidgets('is hidden when demo mode is disabled', (tester) async {
    setDemoModeEnabled(false);

    await tester.pumpWidget(
      const MaterialApp(home: Scaffold(body: DemoModeBanner())),
    );

    // Should render a SizedBox.shrink (zero size)
    final sizedBox = tester.widget<SizedBox>(find.byType(SizedBox));
    expect(sizedBox.width, 0.0);
    expect(sizedBox.height, 0.0);
    expect(find.textContaining('Modo demo'), findsNothing);
  });

  testWidgets('shows banner with demo message when enabled', (tester) async {
    setDemoModeEnabled(true);

    await tester.pumpWidget(
      const MaterialApp(home: Scaffold(body: DemoModeBanner())),
    );

    expect(find.textContaining('Modo demo'), findsOneWidget);
    expect(find.byIcon(Icons.bolt), findsOneWidget);
  });

  testWidgets('does not show close icon when onDismiss is null', (tester) async {
    setDemoModeEnabled(true);

    await tester.pumpWidget(
      const MaterialApp(home: Scaffold(body: DemoModeBanner())),
    );

    expect(find.byIcon(Icons.close), findsNothing);
  });

  testWidgets('shows close icon and calls onDismiss when provided', (tester) async {
    setDemoModeEnabled(true);
    var dismissed = false;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: DemoModeBanner(onDismiss: () => dismissed = true),
        ),
      ),
    );

    expect(find.byIcon(Icons.close), findsOneWidget);

    await tester.tap(find.byIcon(Icons.close));
    await tester.pump();

    expect(dismissed, isTrue);
  });

  testWidgets('banner has amber background color', (tester) async {
    setDemoModeEnabled(true);

    await tester.pumpWidget(
      const MaterialApp(home: Scaffold(body: DemoModeBanner())),
    );

    final container = tester.widget<Container>(find.byType(Container));
    final decoration = container.decoration as BoxDecoration;
    expect(decoration.color, const Color(0xFFF59E0B));
  });
}
