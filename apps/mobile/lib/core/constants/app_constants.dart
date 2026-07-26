/// App-wide constants matching the web frontend.
class AppConstants {
  AppConstants._();

  // ── Roles ────────────────────────────────────────────────────
  static const String roleAdmin = 'admin';
  static const String roleOperator = 'operator';
  static const String roleOwner = 'propietario';
  static const String roleTenant = 'estudiante';
  static const String roleCliente = 'cliente';

  // ── Document types (Colombia) ────────────────────────────────
  static const List<String> cedulaTypes = ['CC', 'CE'];

  // ── Phone prefixes ───────────────────────────────────────────
  static const String defaultPhonePrefix = '+57';
  static const List<String> phonePrefixes = ['+57', '+1', '+34', '+52', '+54', '+56'];

  // ── Currency ─────────────────────────────────────────────────
  static const String currencyCop = 'COP';
  static const String currencyUsd = 'USD';
  static const String copLocale = 'es-CO';
  static const String copSymbol = '\$';

  // ── Price types ──────────────────────────────────────────────
  static const String priceTypeMonthly = 'monthly';
  static const String priceTypeDaily = 'daily';

  // ── Price rate ───────────────────────────────────────────────
  static const String priceRateTrm = 'trm';

  // ── Account status ───────────────────────────────────────────
  static const String statusPending = 'pending';
  static const String statusActive = 'active';
  static const String statusSuspended = 'suspended';
  static const String statusRejected = 'rejected';

  // ── Storage keys ─────────────────────────────────────────────
  static const String keyToken = 'auth_token';
  static const String keyUser = 'user_data';
  static const String keySessionId = 'session_id';
  static const String keyThemeMode = 'theme_mode';

  // ── Pagination ───────────────────────────────────────────────
  static const int defaultPageSize = 20;

  // ── Animation durations ──────────────────────────────────────
  static const Duration durationFast = Duration(milliseconds: 200);
  static const Duration durationMedium = Duration(milliseconds: 300);
  static const Duration durationSlow = Duration(milliseconds: 500);
}
