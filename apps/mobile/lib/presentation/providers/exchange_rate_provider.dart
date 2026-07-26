import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/services/api_client.dart';

/// Exchange rate state.
class ExchangeRateState {
  final double usdToCop;
  final String rate;
  final bool isLoading;
  final String? error;

  const ExchangeRateState({
    this.usdToCop = 0,
    this.rate = 'trm',
    this.isLoading = false,
    this.error,
  });

  ExchangeRateState copyWith({
    double? usdToCop,
    String? rate,
    bool? isLoading,
    String? error,
  }) {
    return ExchangeRateState(
      usdToCop: usdToCop ?? this.usdToCop,
      rate: rate ?? this.rate,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

/// Exchange rate notifier — fetches USD/COP TRM from backend.
class ExchangeRateNotifier extends StateNotifier<ExchangeRateState> {
  ExchangeRateNotifier(this._ref) : super(const ExchangeRateState());

  final Ref _ref;

  Future<void> fetch() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _ref.read(apiClientProvider).getExchangeRate();
      final data = response.data;
      state = ExchangeRateState(
        usdToCop: (data['usdToCop'] as num?)?.toDouble() ?? 0,
        rate: data['rate'] as String? ?? 'trm',
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  /// Convert USD to COP.
  double getCopFor(double usdAmount) => usdAmount * state.usdToCop;
}

final exchangeRateProvider =
    StateNotifierProvider<ExchangeRateNotifier, ExchangeRateState>((ref) {
  return ExchangeRateNotifier(ref);
});
