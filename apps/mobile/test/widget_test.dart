import 'package:flutter_test/flutter_test.dart';

import 'package:ohana_mobile/core/theme/app_theme.dart';

void main() {
  testWidgets('App theme builds without error', (WidgetTester tester) async {
    expect(AppTheme.light(), isNotNull);
    expect(AppTheme.dark(), isNotNull);
  });
}
