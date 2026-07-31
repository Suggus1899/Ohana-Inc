import 'package:flutter/material.dart';

/// Ohana brand logo.
///
/// A stylized "O" ring enclosing a house silhouette — represents "family/home"
/// (Ohana in Hawaiian). Uses `currentColor` semantics via the provided [color]
/// (defaults to the theme's primary color).
class OhanaLogo extends StatelessWidget {
  const OhanaLogo({
    super.key,
    this.size = 28,
    this.color,
    this.showWordmark = true,
    this.wordmarkStyle,
  });

  /// Diameter of the "O" mark.
  final double size;

  /// Color of the mark. Defaults to `Theme.of(context).colorScheme.primary`.
  final Color? color;

  /// Whether to show the "Ohana" wordmark next to the mark.
  final bool showWordmark;

  /// Optional style override for the wordmark text.
  final TextStyle? wordmarkStyle;

  @override
  Widget build(BuildContext context) {
    final c = color ?? Theme.of(context).colorScheme.primary;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        CustomPaint(
          size: Size.square(size),
          painter: _OhanaMarkPainter(c),
        ),
        if (showWordmark) ...[
          const SizedBox(width: 8),
          Text(
            'Ohana',
            style: wordmarkStyle ??
                TextStyle(
                  color: c,
                  fontSize: size * 0.62,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.3,
                ),
          ),
        ],
      ],
    );
  }
}

class _OhanaMarkPainter extends CustomPainter {
  const _OhanaMarkPainter(this.color);

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // Outer "O" ring
    final ringPaint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = w * 0.094;
    canvas.drawCircle(Offset(w / 2, h / 2), w * 0.39, ringPaint);

    // House roof (chevron) inside the O
    final roof = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = w * 0.075
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    final roofPath = Path()
      ..moveTo(w * 0.33, h * 0.58)
      ..lineTo(w * 0.50, h * 0.41)
      ..lineTo(w * 0.67, h * 0.58);
    canvas.drawPath(roofPath, roof);

    // House body (U shape) inside the O
    final body = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = w * 0.075
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    final bodyPath = Path()
      ..moveTo(w * 0.39, h * 0.58)
      ..lineTo(w * 0.39, h * 0.69)
      ..lineTo(w * 0.61, h * 0.69)
      ..lineTo(w * 0.61, h * 0.58);
    canvas.drawPath(bodyPath, body);
  }

  @override
  bool shouldRepaint(_OhanaMarkPainter oldDelegate) =>
      oldDelegate.color != color;
}
