import 'package:intl/intl.dart';

/// Price formatting utilities matching the web frontend formatPrice.ts.
class PriceFormatter {
  PriceFormatter._();

  /// Format USD amount.
  static String formatUsd(double amount) {
    final format = NumberFormat.currency(locale: 'en-US', symbol: '\$', decimalDigits: 0);
    return format.format(amount);
  }

  /// Format COP amount.
  static String formatCop(double amount) {
    final format = NumberFormat.currency(locale: 'es-CO', symbol: '\$', decimalDigits: 0);
    return format.format(amount);
  }

  /// Format dual price (USD + COP).
  static String formatDualPrice(double usdAmount, double usdToCopRate) {
    final usd = formatUsd(usdAmount);
    final cop = formatCop(usdAmount * usdToCopRate);
    return '$usd / $cop COP';
  }

  /// Format short COP (for badges).
  static String formatCopShort(double amount) {
    if (amount >= 1000000) {
      return '\$${(amount / 1000000).toStringAsFixed(1)}M';
    } else if (amount >= 1000) {
      return '\$${(amount / 1000).toStringAsFixed(0)}K';
    }
    return formatCop(amount);
  }

  /// Format price with type label.
  static String formatPriceWithType(double amount, String priceType, {double? usdToCopRate}) {
    final usd = formatUsd(amount);
    final typeLabel = priceType == 'monthly' ? '/mes' : '/dia';
    if (usdToCopRate != null && usdToCopRate > 0) {
      final cop = formatCop(amount * usdToCopRate);
      return '$usd$typeLabel / $cop COP';
    }
    return '$usd$typeLabel';
  }
}

/// Date formatting utilities.
class DateFormatter {
  DateFormatter._();

  static String formatDate(String isoDate) {
    final dt = DateTime.parse(isoDate);
    return DateFormat('d MMM yyyy', 'es_CO').format(dt);
  }

  static String formatDateTime(String isoDate) {
    final dt = DateTime.parse(isoDate);
    return DateFormat('d MMM yyyy, HH:mm', 'es_CO').format(dt);
  }

  static String timeAgo(String isoDate) {
    final dt = DateTime.parse(isoDate);
    final now = DateTime.now();
    final diff = now.difference(dt);

    if (diff.inMinutes < 1) return 'ahora';
    if (diff.inMinutes < 60) return 'hace ${diff.inMinutes} min';
    if (diff.inHours < 24) return 'hace ${diff.inHours} h';
    if (diff.inDays < 7) return 'hace ${diff.inDays} dias';
    if (diff.inDays < 30) return 'hace ${(diff.inDays / 7).floor()} sem';
    if (diff.inDays < 365) return 'hace ${(diff.inDays / 30).floor()} mes';
    return 'hace ${(diff.inDays / 365).floor()} anos';
  }
}
