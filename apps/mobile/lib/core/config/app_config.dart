/// App configuration — environment values.
///
/// In production these would come from --dart-define or .env.
/// For dev, defaults point to local backend at localhost:3026.
class AppConfig {
  AppConfig._();

  /// Backend API base URL.
  /// Android emulator uses 10.0.2.2 to reach host machine's localhost.
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3026/api',
  );

  /// Socket.IO URL for real-time chat.
  static const String socketUrl = String.fromEnvironment(
    'SOCKET_URL',
    defaultValue: 'http://10.0.2.2:3026',
  );

  /// App name
  static const String appName = 'Ohana';

  /// Support phone (Colombia)
  static const String supportPhone = '+573001234567';

  /// Support email
  static const String supportEmail = 'soporte@ohana.com';

  /// Default map center (Bogotá)
  static const double defaultLat = 4.7110;
  static const double defaultLng = -74.0721;
}
