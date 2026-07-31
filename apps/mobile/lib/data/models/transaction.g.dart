// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'transaction.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Transaction _$TransactionFromJson(Map<String, dynamic> json) => _Transaction(
  id: (json['id'] as num).toInt(),
  propertyId: (json['propertyId'] as num).toInt(),
  tenantId: (json['tenantId'] as num).toInt(),
  ownerId: (json['ownerId'] as num).toInt(),
  amount: (json['amount'] as num).toDouble(),
  currency: json['currency'] as String? ?? 'USD',
  paymentMethod: json['paymentMethod'] as String?,
  status: json['status'] as String? ?? 'pending',
  reference: json['reference'] as String?,
  createdAt: json['createdAt'] as String,
  updatedAt: json['updatedAt'] as String,
);

Map<String, dynamic> _$TransactionToJson(_Transaction instance) =>
    <String, dynamic>{
      'id': instance.id,
      'propertyId': instance.propertyId,
      'tenantId': instance.tenantId,
      'ownerId': instance.ownerId,
      'amount': instance.amount,
      'currency': instance.currency,
      'paymentMethod': instance.paymentMethod,
      'status': instance.status,
      'reference': instance.reference,
      'createdAt': instance.createdAt,
      'updatedAt': instance.updatedAt,
    };

_Conversation _$ConversationFromJson(Map<String, dynamic> json) =>
    _Conversation(
      id: (json['id'] as num).toInt(),
      propertyId: (json['propertyId'] as num?)?.toInt(),
      otherUserId: (json['otherUserId'] as num).toInt(),
      otherUserName: json['otherUserName'] as String,
      otherUserPhoto: json['otherUserPhoto'] as String?,
      propertyTitle: json['propertyTitle'] as String?,
      lastMessage: json['lastMessage'] as String?,
      lastMessageAt: json['lastMessageAt'] as String?,
      unreadCount: (json['unreadCount'] as num?)?.toInt() ?? 0,
    );

Map<String, dynamic> _$ConversationToJson(_Conversation instance) =>
    <String, dynamic>{
      'id': instance.id,
      'propertyId': instance.propertyId,
      'otherUserId': instance.otherUserId,
      'otherUserName': instance.otherUserName,
      'otherUserPhoto': instance.otherUserPhoto,
      'propertyTitle': instance.propertyTitle,
      'lastMessage': instance.lastMessage,
      'lastMessageAt': instance.lastMessageAt,
      'unreadCount': instance.unreadCount,
    };

_Message _$MessageFromJson(Map<String, dynamic> json) => _Message(
  id: (json['id'] as num).toInt(),
  conversationId: (json['conversationId'] as num).toInt(),
  senderId: (json['senderId'] as num).toInt(),
  content: json['content'] as String,
  type: json['type'] as String? ?? 'text',
  isRead: json['isRead'] as bool? ?? false,
  createdAt: json['createdAt'] as String,
);

Map<String, dynamic> _$MessageToJson(_Message instance) => <String, dynamic>{
  'id': instance.id,
  'conversationId': instance.conversationId,
  'senderId': instance.senderId,
  'content': instance.content,
  'type': instance.type,
  'isRead': instance.isRead,
  'createdAt': instance.createdAt,
};

_Notification _$NotificationFromJson(Map<String, dynamic> json) =>
    _Notification(
      id: (json['id'] as num).toInt(),
      title: json['title'] as String,
      message: json['message'] as String,
      type: json['type'] as String? ?? 'info',
      isRead: json['isRead'] as bool? ?? false,
      createdAt: json['createdAt'] as String,
    );

Map<String, dynamic> _$NotificationToJson(_Notification instance) =>
    <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'message': instance.message,
      'type': instance.type,
      'isRead': instance.isRead,
      'createdAt': instance.createdAt,
    };

_RentRequest _$RentRequestFromJson(Map<String, dynamic> json) => _RentRequest(
  id: (json['id'] as num).toInt(),
  propertyId: (json['propertyId'] as num).toInt(),
  tenantId: (json['tenantId'] as num).toInt(),
  status: json['status'] as String? ?? 'pending',
  moveInDate: json['moveInDate'] as String?,
  duration: (json['duration'] as num?)?.toInt(),
  message: json['message'] as String?,
  createdAt: json['createdAt'] as String,
);

Map<String, dynamic> _$RentRequestToJson(_RentRequest instance) =>
    <String, dynamic>{
      'id': instance.id,
      'propertyId': instance.propertyId,
      'tenantId': instance.tenantId,
      'status': instance.status,
      'moveInDate': instance.moveInDate,
      'duration': instance.duration,
      'message': instance.message,
      'createdAt': instance.createdAt,
    };

_ExchangeRate _$ExchangeRateFromJson(Map<String, dynamic> json) =>
    _ExchangeRate(
      usdToCop: (json['usdToCop'] as num).toDouble(),
      rate: json['rate'] as String? ?? 'trm',
      updatedAt: json['updatedAt'] as String,
    );

Map<String, dynamic> _$ExchangeRateToJson(_ExchangeRate instance) =>
    <String, dynamic>{
      'usdToCop': instance.usdToCop,
      'rate': instance.rate,
      'updatedAt': instance.updatedAt,
    };
