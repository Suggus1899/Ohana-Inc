import 'package:freezed_annotation/freezed_annotation.dart';

part 'transaction.freezed.dart';
part 'transaction.g.dart';

@freezed
abstract class Transaction with _$Transaction {
  const factory Transaction({
    required int id,
    @JsonKey(name: 'propertyId') required int propertyId,
    @JsonKey(name: 'tenantId') required int tenantId,
    @JsonKey(name: 'ownerId') required int ownerId,
    @JsonKey(name: 'amount') required double amount,
    @JsonKey(name: 'currency') @Default('USD') String currency,
    @JsonKey(name: 'paymentMethod') String? paymentMethod,
    @JsonKey(name: 'status') @Default('pending') String status,
    @JsonKey(name: 'reference') String? reference,
    @JsonKey(name: 'createdAt') required String createdAt,
    @JsonKey(name: 'updatedAt') required String updatedAt,
  }) = _Transaction;

  factory Transaction.fromJson(Map<String, dynamic> json) =>
      _$TransactionFromJson(json);
}

@freezed
abstract class Conversation with _$Conversation {
  const factory Conversation({
    required int id,
    @JsonKey(name: 'propertyId') int? propertyId,
    @JsonKey(name: 'otherUserId') required int otherUserId,
    @JsonKey(name: 'otherUserName') required String otherUserName,
    @JsonKey(name: 'otherUserPhoto') String? otherUserPhoto,
    @JsonKey(name: 'propertyTitle') String? propertyTitle,
    @JsonKey(name: 'lastMessage') String? lastMessage,
    @JsonKey(name: 'lastMessageAt') String? lastMessageAt,
    @JsonKey(name: 'unreadCount') @Default(0) int unreadCount,
  }) = _Conversation;

  factory Conversation.fromJson(Map<String, dynamic> json) =>
      _$ConversationFromJson(json);
}

@freezed
abstract class Message with _$Message {
  const factory Message({
    required int id,
    @JsonKey(name: 'conversationId') required int conversationId,
    @JsonKey(name: 'senderId') required int senderId,
    @JsonKey(name: 'content') required String content,
    @JsonKey(name: 'type') @Default('text') String type,
    @JsonKey(name: 'isRead') @Default(false) bool isRead,
    @JsonKey(name: 'createdAt') required String createdAt,
  }) = _Message;

  factory Message.fromJson(Map<String, dynamic> json) =>
      _$MessageFromJson(json);
}

@freezed
abstract class Notification with _$Notification {
  const factory Notification({
    required int id,
    @JsonKey(name: 'title') required String title,
    @JsonKey(name: 'message') required String message,
    @JsonKey(name: 'type') @Default('info') String type,
    @JsonKey(name: 'isRead') @Default(false) bool isRead,
    @JsonKey(name: 'createdAt') required String createdAt,
  }) = _Notification;

  factory Notification.fromJson(Map<String, dynamic> json) =>
      _$NotificationFromJson(json);
}

@freezed
abstract class RentRequest with _$RentRequest {
  const factory RentRequest({
    required int id,
    @JsonKey(name: 'propertyId') required int propertyId,
    @JsonKey(name: 'tenantId') required int tenantId,
    @JsonKey(name: 'status') @Default('pending') String status,
    @JsonKey(name: 'moveInDate') String? moveInDate,
    @JsonKey(name: 'duration') int? duration,
    @JsonKey(name: 'message') String? message,
    @JsonKey(name: 'createdAt') required String createdAt,
  }) = _RentRequest;

  factory RentRequest.fromJson(Map<String, dynamic> json) =>
      _$RentRequestFromJson(json);
}

@freezed
abstract class ExchangeRate with _$ExchangeRate {
  const factory ExchangeRate({
    @JsonKey(name: 'usdToCop') required double usdToCop,
    @JsonKey(name: 'rate') @Default('trm') String rate,
    @JsonKey(name: 'updatedAt') required String updatedAt,
  }) = _ExchangeRate;

  factory ExchangeRate.fromJson(Map<String, dynamic> json) =>
      _$ExchangeRateFromJson(json);
}
