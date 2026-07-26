import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/services/api_client.dart';

/// Properties list state.
class PropertiesState {
  final List<Map<String, dynamic>> properties;
  final bool isLoading;
  final bool hasMore;
  final int currentPage;
  final String? error;
  final String? searchQuery;

  const PropertiesState({
    this.properties = const [],
    this.isLoading = false,
    this.hasMore = true,
    this.currentPage = 1,
    this.error,
    this.searchQuery,
  });

  PropertiesState copyWith({
    List<Map<String, dynamic>>? properties,
    bool? isLoading,
    bool? hasMore,
    int? currentPage,
    String? error,
    String? searchQuery,
  }) {
    return PropertiesState(
      properties: properties ?? this.properties,
      isLoading: isLoading ?? this.isLoading,
      hasMore: hasMore ?? this.hasMore,
      currentPage: currentPage ?? this.currentPage,
      error: error,
      searchQuery: searchQuery ?? this.searchQuery,
    );
  }
}

/// Properties notifier — handles listing, search, pagination.
class PropertiesNotifier extends StateNotifier<PropertiesState> {
  PropertiesNotifier(this._ref) : super(const PropertiesState());

  final Ref _ref;

  Future<void> refresh() async {
    state = const PropertiesState();
    await fetchPage(1);
  }

  Future<void> search(String query) async {
    state = PropertiesState(searchQuery: query);
    await fetchPage(1);
  }

  Future<void> loadMore() async {
    if (state.isLoading || !state.hasMore) return;
    await fetchPage(state.currentPage + 1);
  }

  Future<void> fetchPage(int page) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _ref.read(apiClientProvider).getProperties(
            page: page,
            limit: 20,
            search: state.searchQuery,
          );
      final data = response.data;
      final List<dynamic> items = data['data'] ?? data['properties'] ?? [];
      final totalPages = data['totalPages'] ?? 1;

      final newProperties = items.cast<Map<String, dynamic>>();
      final allProperties = page == 1
          ? newProperties
          : [...state.properties, ...newProperties];

      state = state.copyWith(
        properties: allProperties,
        isLoading: false,
        currentPage: page,
        hasMore: page < totalPages,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }
}

final propertiesProvider =
    StateNotifierProvider<PropertiesNotifier, PropertiesState>((ref) {
  return PropertiesNotifier(ref);
});

/// Single property state.
class PropertyDetailState {
  final Map<String, dynamic>? property;
  final bool isLoading;
  final String? error;

  const PropertyDetailState({this.property, this.isLoading = false, this.error});

  PropertyDetailState copyWith({
    Map<String, dynamic>? property,
    bool? isLoading,
    String? error,
  }) {
    return PropertyDetailState(
      property: property ?? this.property,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

/// Property detail notifier.
class PropertyDetailNotifier extends StateNotifier<PropertyDetailState> {
  PropertyDetailNotifier(this._ref) : super(const PropertyDetailState());

  final Ref _ref;

  Future<void> fetch(int id) async {
    state = const PropertyDetailState(isLoading: true);
    try {
      final response = await _ref.read(apiClientProvider).getProperty(id);
      state = PropertyDetailState(property: response.data as Map<String, dynamic>);
    } catch (e) {
      state = PropertyDetailState(error: e.toString());
    }
  }
}

final propertyDetailProvider =
    StateNotifierProvider<PropertyDetailNotifier, PropertyDetailState>((ref) {
  return PropertyDetailNotifier(ref);
});
