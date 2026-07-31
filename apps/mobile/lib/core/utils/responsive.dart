import 'package:flutter/material.dart';

/// Responsive breakpoints matching the web frontend Tailwind config.
///
/// Usage in widgets:
/// ```
/// final bp = ResponsiveBreakpoint.of(context);
/// if (bp.isTablet) { ... }
/// ```
class ResponsiveBreakpoint {
  const ResponsiveBreakpoint._(this.width);

  final double width;

  /// Phone (default) — width < 600
  bool get isPhone => width < 600;

  /// Tablet — 600 <= width < 900
  bool get isTablet => width >= 600 && width < 900;

  /// Desktop — 900 <= width < 1200
  bool get isDesktop => width >= 900 && width < 1200;

  /// Wide desktop — width >= 1200
  bool get isWide => width >= 1200;

  /// Whether the layout should use a multi-column / expanded layout.
  bool get isTabletOrWider => width >= 600;

  /// Whether the layout is compact (small phone).
  bool get isCompact => width < 360;

  /// Grid columns for the current width (matches web Tailwind grid).
  int get gridColumns {
    if (width >= 1200) return 4;
    if (width >= 900) return 3;
    if (width >= 600) return 2;
    return 1;
  }

  /// Horizontal padding for the current width.
  double get horizontalPadding {
    if (width >= 1200) return 48;
    if (width >= 900) return 32;
    if (width >= 600) return 24;
    return 16;
  }

  /// Max content width for centered single-column layouts.
  double get maxContentWidth {
    if (width >= 1200) return 1100;
    if (width >= 900) return 800;
    if (width >= 600) return 600;
    return double.infinity;
  }

  static ResponsiveBreakpoint of(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    return ResponsiveBreakpoint._(width);
  }
}

/// Widget that rebuilds when the viewport crosses a breakpoint.
///
/// More efficient than [LayoutBuilder] for top-level scaffolds because
/// it only rebuilds when the breakpoint bucket changes, not on every
/// pixel resize.
class ResponsiveBuilder extends StatelessWidget {
  const ResponsiveBuilder({
    super.key,
    required this.builder,
  });

  final Widget Function(BuildContext context, ResponsiveBreakpoint breakpoint)
      builder;

  @override
  Widget build(BuildContext context) {
    final bp = ResponsiveBreakpoint.of(context);
    return builder(context, bp);
  }
}
