import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/services/api_client.dart';

/// Dashboard data providers using Riverpod FutureProvider.
///
/// These replace the manual initState + setState + _loading + _error
/// pattern used in the dashboard tabs. FutureProvider automatically
/// handles loading, error, and data states, and supports refresh
/// via ref.refresh() / ref.invalidate().

// ---- Admin ----

/// Admin home statistics (total users, properties, revenue, etc.)
final adminStatsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final res = await ref.read(apiClientProvider).getStatistics();
  return res.data as Map<String, dynamic>? ?? {};
});

/// User list for admin Users tab
final usersListProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final res = await ref.read(apiClientProvider).getUsers(page: 1, limit: 50);
  final data = res.data;
  final List<dynamic> items = data is Map ? (data['data'] ?? data['users'] ?? []) as List : [];
  return items.cast<Map<String, dynamic>>();
});

/// Reports list for admin Reports tab
final reportsListProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final res = await ref.read(apiClientProvider).getReports();
  final data = res.data;
  final List<dynamic> items = data is Map ? (data['data'] ?? data['reports'] ?? []) as List : [];
  return items.cast<Map<String, dynamic>>();
});

/// App settings for admin Settings tab
final appSettingsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final res = await ref.read(apiClientProvider).getSettings();
  return res.data as Map<String, dynamic>? ?? {};
});

// ---- Operator ----

// Operator tasks provider will be added when getTasks is implemented in ApiClient

// ---- Owner ----

// Owner properties provider will be added when getMyProperties is implemented in ApiClient

// ---- Tenant ----

/// Available properties for tenant discovery
final discoverPropertiesProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final res = await ref.read(apiClientProvider).getProperties(page: 1, limit: 20);
  final data = res.data;
  final List<dynamic> items = data is Map ? (data['data'] ?? data['properties'] ?? []) as List : [];
  return items.cast<Map<String, dynamic>>();
});

/// User favorites
final favoritesProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final res = await ref.read(apiClientProvider).getFavorites();
  final data = res.data;
  final List<dynamic> items = data is Map ? (data['data'] ?? data['favorites'] ?? []) as List : [];
  return items.cast<Map<String, dynamic>>();
});
