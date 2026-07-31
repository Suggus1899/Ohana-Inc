import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:ohana_mobile/presentation/widgets/ohana_logo.dart';

/// Tests for OhanaLogo — the brand mark widget used in app bars
/// and login screens.
///
/// Verifies that the logo renders with and without the wordmark,
/// respects the size parameter, and uses the provided color.
void main() {
  testWidgets('renders wordmark by default', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(home: Scaffold(body: OhanaLogo())),
    );

    expect(find.byType(OhanaLogo), findsOneWidget);
    expect(find.text('Ohana'), findsOneWidget);
  });

  testWidgets('hides wordmark when showWordmark is false', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(body: OhanaLogo(showWordmark: false)),
      ),
    );

    expect(find.byType(OhanaLogo), findsOneWidget);
    expect(find.text('Ohana'), findsNothing);
  });

  testWidgets('uses provided color', (tester) async {
    const testColor = Colors.red;

    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(body: OhanaLogo(color: testColor)),
      ),
    );

    final logo = tester.widget<OhanaLogo>(find.byType(OhanaLogo));
    expect(logo.color, testColor);
  });

  testWidgets('respects size parameter', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(body: OhanaLogo(size: 50)),
      ),
    );

    final logo = tester.widget<OhanaLogo>(find.byType(OhanaLogo));
    expect(logo.size, 50);
  });

  testWidgets('renders without error in dark theme', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: ThemeData.dark(),
        home: const Scaffold(body: OhanaLogo()),
      ),
    );

    expect(find.byType(OhanaLogo), findsOneWidget);
    expect(find.text('Ohana'), findsOneWidget);
  });

  testWidgets('wordmark text uses custom style when provided', (tester) async {
    const customStyle = TextStyle(
      fontSize: 24,
      fontWeight: FontWeight.w900,
      color: Colors.green,
    );

    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: OhanaLogo(wordmarkStyle: customStyle),
        ),
      ),
    );

    final text = tester.widget<Text>(find.text('Ohana'));
    expect(text.style?.fontSize, 24);
    expect(text.style?.fontWeight, FontWeight.w900);
    expect(text.style?.color, Colors.green);
  });
}
