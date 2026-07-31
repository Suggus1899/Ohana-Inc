// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'transaction.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$Transaction {

 int get id;@JsonKey(name: 'propertyId') int get propertyId;@JsonKey(name: 'tenantId') int get tenantId;@JsonKey(name: 'ownerId') int get ownerId;@JsonKey(name: 'amount') double get amount;@JsonKey(name: 'currency') String get currency;@JsonKey(name: 'paymentMethod') String? get paymentMethod;@JsonKey(name: 'status') String get status;@JsonKey(name: 'reference') String? get reference;@JsonKey(name: 'createdAt') String get createdAt;@JsonKey(name: 'updatedAt') String get updatedAt;
/// Create a copy of Transaction
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$TransactionCopyWith<Transaction> get copyWith => _$TransactionCopyWithImpl<Transaction>(this as Transaction, _$identity);

  /// Serializes this Transaction to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Transaction&&(identical(other.id, id) || other.id == id)&&(identical(other.propertyId, propertyId) || other.propertyId == propertyId)&&(identical(other.tenantId, tenantId) || other.tenantId == tenantId)&&(identical(other.ownerId, ownerId) || other.ownerId == ownerId)&&(identical(other.amount, amount) || other.amount == amount)&&(identical(other.currency, currency) || other.currency == currency)&&(identical(other.paymentMethod, paymentMethod) || other.paymentMethod == paymentMethod)&&(identical(other.status, status) || other.status == status)&&(identical(other.reference, reference) || other.reference == reference)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,propertyId,tenantId,ownerId,amount,currency,paymentMethod,status,reference,createdAt,updatedAt);

@override
String toString() {
  return 'Transaction(id: $id, propertyId: $propertyId, tenantId: $tenantId, ownerId: $ownerId, amount: $amount, currency: $currency, paymentMethod: $paymentMethod, status: $status, reference: $reference, createdAt: $createdAt, updatedAt: $updatedAt)';
}


}

/// @nodoc
abstract mixin class $TransactionCopyWith<$Res>  {
  factory $TransactionCopyWith(Transaction value, $Res Function(Transaction) _then) = _$TransactionCopyWithImpl;
@useResult
$Res call({
 int id,@JsonKey(name: 'propertyId') int propertyId,@JsonKey(name: 'tenantId') int tenantId,@JsonKey(name: 'ownerId') int ownerId,@JsonKey(name: 'amount') double amount,@JsonKey(name: 'currency') String currency,@JsonKey(name: 'paymentMethod') String? paymentMethod,@JsonKey(name: 'status') String status,@JsonKey(name: 'reference') String? reference,@JsonKey(name: 'createdAt') String createdAt,@JsonKey(name: 'updatedAt') String updatedAt
});




}
/// @nodoc
class _$TransactionCopyWithImpl<$Res>
    implements $TransactionCopyWith<$Res> {
  _$TransactionCopyWithImpl(this._self, this._then);

  final Transaction _self;
  final $Res Function(Transaction) _then;

/// Create a copy of Transaction
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? propertyId = null,Object? tenantId = null,Object? ownerId = null,Object? amount = null,Object? currency = null,Object? paymentMethod = freezed,Object? status = null,Object? reference = freezed,Object? createdAt = null,Object? updatedAt = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,propertyId: null == propertyId ? _self.propertyId : propertyId // ignore: cast_nullable_to_non_nullable
as int,tenantId: null == tenantId ? _self.tenantId : tenantId // ignore: cast_nullable_to_non_nullable
as int,ownerId: null == ownerId ? _self.ownerId : ownerId // ignore: cast_nullable_to_non_nullable
as int,amount: null == amount ? _self.amount : amount // ignore: cast_nullable_to_non_nullable
as double,currency: null == currency ? _self.currency : currency // ignore: cast_nullable_to_non_nullable
as String,paymentMethod: freezed == paymentMethod ? _self.paymentMethod : paymentMethod // ignore: cast_nullable_to_non_nullable
as String?,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,reference: freezed == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String?,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as String,updatedAt: null == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [Transaction].
extension TransactionPatterns on Transaction {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Transaction value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Transaction() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Transaction value)  $default,){
final _that = this;
switch (_that) {
case _Transaction():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Transaction value)?  $default,){
final _that = this;
switch (_that) {
case _Transaction() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int id, @JsonKey(name: 'propertyId')  int propertyId, @JsonKey(name: 'tenantId')  int tenantId, @JsonKey(name: 'ownerId')  int ownerId, @JsonKey(name: 'amount')  double amount, @JsonKey(name: 'currency')  String currency, @JsonKey(name: 'paymentMethod')  String? paymentMethod, @JsonKey(name: 'status')  String status, @JsonKey(name: 'reference')  String? reference, @JsonKey(name: 'createdAt')  String createdAt, @JsonKey(name: 'updatedAt')  String updatedAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Transaction() when $default != null:
return $default(_that.id,_that.propertyId,_that.tenantId,_that.ownerId,_that.amount,_that.currency,_that.paymentMethod,_that.status,_that.reference,_that.createdAt,_that.updatedAt);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int id, @JsonKey(name: 'propertyId')  int propertyId, @JsonKey(name: 'tenantId')  int tenantId, @JsonKey(name: 'ownerId')  int ownerId, @JsonKey(name: 'amount')  double amount, @JsonKey(name: 'currency')  String currency, @JsonKey(name: 'paymentMethod')  String? paymentMethod, @JsonKey(name: 'status')  String status, @JsonKey(name: 'reference')  String? reference, @JsonKey(name: 'createdAt')  String createdAt, @JsonKey(name: 'updatedAt')  String updatedAt)  $default,) {final _that = this;
switch (_that) {
case _Transaction():
return $default(_that.id,_that.propertyId,_that.tenantId,_that.ownerId,_that.amount,_that.currency,_that.paymentMethod,_that.status,_that.reference,_that.createdAt,_that.updatedAt);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int id, @JsonKey(name: 'propertyId')  int propertyId, @JsonKey(name: 'tenantId')  int tenantId, @JsonKey(name: 'ownerId')  int ownerId, @JsonKey(name: 'amount')  double amount, @JsonKey(name: 'currency')  String currency, @JsonKey(name: 'paymentMethod')  String? paymentMethod, @JsonKey(name: 'status')  String status, @JsonKey(name: 'reference')  String? reference, @JsonKey(name: 'createdAt')  String createdAt, @JsonKey(name: 'updatedAt')  String updatedAt)?  $default,) {final _that = this;
switch (_that) {
case _Transaction() when $default != null:
return $default(_that.id,_that.propertyId,_that.tenantId,_that.ownerId,_that.amount,_that.currency,_that.paymentMethod,_that.status,_that.reference,_that.createdAt,_that.updatedAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _Transaction implements Transaction {
  const _Transaction({required this.id, @JsonKey(name: 'propertyId') required this.propertyId, @JsonKey(name: 'tenantId') required this.tenantId, @JsonKey(name: 'ownerId') required this.ownerId, @JsonKey(name: 'amount') required this.amount, @JsonKey(name: 'currency') this.currency = 'USD', @JsonKey(name: 'paymentMethod') this.paymentMethod, @JsonKey(name: 'status') this.status = 'pending', @JsonKey(name: 'reference') this.reference, @JsonKey(name: 'createdAt') required this.createdAt, @JsonKey(name: 'updatedAt') required this.updatedAt});
  factory _Transaction.fromJson(Map<String, dynamic> json) => _$TransactionFromJson(json);

@override final  int id;
@override@JsonKey(name: 'propertyId') final  int propertyId;
@override@JsonKey(name: 'tenantId') final  int tenantId;
@override@JsonKey(name: 'ownerId') final  int ownerId;
@override@JsonKey(name: 'amount') final  double amount;
@override@JsonKey(name: 'currency') final  String currency;
@override@JsonKey(name: 'paymentMethod') final  String? paymentMethod;
@override@JsonKey(name: 'status') final  String status;
@override@JsonKey(name: 'reference') final  String? reference;
@override@JsonKey(name: 'createdAt') final  String createdAt;
@override@JsonKey(name: 'updatedAt') final  String updatedAt;

/// Create a copy of Transaction
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$TransactionCopyWith<_Transaction> get copyWith => __$TransactionCopyWithImpl<_Transaction>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$TransactionToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _Transaction&&(identical(other.id, id) || other.id == id)&&(identical(other.propertyId, propertyId) || other.propertyId == propertyId)&&(identical(other.tenantId, tenantId) || other.tenantId == tenantId)&&(identical(other.ownerId, ownerId) || other.ownerId == ownerId)&&(identical(other.amount, amount) || other.amount == amount)&&(identical(other.currency, currency) || other.currency == currency)&&(identical(other.paymentMethod, paymentMethod) || other.paymentMethod == paymentMethod)&&(identical(other.status, status) || other.status == status)&&(identical(other.reference, reference) || other.reference == reference)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,propertyId,tenantId,ownerId,amount,currency,paymentMethod,status,reference,createdAt,updatedAt);

@override
String toString() {
  return 'Transaction(id: $id, propertyId: $propertyId, tenantId: $tenantId, ownerId: $ownerId, amount: $amount, currency: $currency, paymentMethod: $paymentMethod, status: $status, reference: $reference, createdAt: $createdAt, updatedAt: $updatedAt)';
}


}

/// @nodoc
abstract mixin class _$TransactionCopyWith<$Res> implements $TransactionCopyWith<$Res> {
  factory _$TransactionCopyWith(_Transaction value, $Res Function(_Transaction) _then) = __$TransactionCopyWithImpl;
@override @useResult
$Res call({
 int id,@JsonKey(name: 'propertyId') int propertyId,@JsonKey(name: 'tenantId') int tenantId,@JsonKey(name: 'ownerId') int ownerId,@JsonKey(name: 'amount') double amount,@JsonKey(name: 'currency') String currency,@JsonKey(name: 'paymentMethod') String? paymentMethod,@JsonKey(name: 'status') String status,@JsonKey(name: 'reference') String? reference,@JsonKey(name: 'createdAt') String createdAt,@JsonKey(name: 'updatedAt') String updatedAt
});




}
/// @nodoc
class __$TransactionCopyWithImpl<$Res>
    implements _$TransactionCopyWith<$Res> {
  __$TransactionCopyWithImpl(this._self, this._then);

  final _Transaction _self;
  final $Res Function(_Transaction) _then;

/// Create a copy of Transaction
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? propertyId = null,Object? tenantId = null,Object? ownerId = null,Object? amount = null,Object? currency = null,Object? paymentMethod = freezed,Object? status = null,Object? reference = freezed,Object? createdAt = null,Object? updatedAt = null,}) {
  return _then(_Transaction(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,propertyId: null == propertyId ? _self.propertyId : propertyId // ignore: cast_nullable_to_non_nullable
as int,tenantId: null == tenantId ? _self.tenantId : tenantId // ignore: cast_nullable_to_non_nullable
as int,ownerId: null == ownerId ? _self.ownerId : ownerId // ignore: cast_nullable_to_non_nullable
as int,amount: null == amount ? _self.amount : amount // ignore: cast_nullable_to_non_nullable
as double,currency: null == currency ? _self.currency : currency // ignore: cast_nullable_to_non_nullable
as String,paymentMethod: freezed == paymentMethod ? _self.paymentMethod : paymentMethod // ignore: cast_nullable_to_non_nullable
as String?,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,reference: freezed == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String?,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as String,updatedAt: null == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}


/// @nodoc
mixin _$Conversation {

 int get id;@JsonKey(name: 'propertyId') int? get propertyId;@JsonKey(name: 'otherUserId') int get otherUserId;@JsonKey(name: 'otherUserName') String get otherUserName;@JsonKey(name: 'otherUserPhoto') String? get otherUserPhoto;@JsonKey(name: 'propertyTitle') String? get propertyTitle;@JsonKey(name: 'lastMessage') String? get lastMessage;@JsonKey(name: 'lastMessageAt') String? get lastMessageAt;@JsonKey(name: 'unreadCount') int get unreadCount;
/// Create a copy of Conversation
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ConversationCopyWith<Conversation> get copyWith => _$ConversationCopyWithImpl<Conversation>(this as Conversation, _$identity);

  /// Serializes this Conversation to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Conversation&&(identical(other.id, id) || other.id == id)&&(identical(other.propertyId, propertyId) || other.propertyId == propertyId)&&(identical(other.otherUserId, otherUserId) || other.otherUserId == otherUserId)&&(identical(other.otherUserName, otherUserName) || other.otherUserName == otherUserName)&&(identical(other.otherUserPhoto, otherUserPhoto) || other.otherUserPhoto == otherUserPhoto)&&(identical(other.propertyTitle, propertyTitle) || other.propertyTitle == propertyTitle)&&(identical(other.lastMessage, lastMessage) || other.lastMessage == lastMessage)&&(identical(other.lastMessageAt, lastMessageAt) || other.lastMessageAt == lastMessageAt)&&(identical(other.unreadCount, unreadCount) || other.unreadCount == unreadCount));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,propertyId,otherUserId,otherUserName,otherUserPhoto,propertyTitle,lastMessage,lastMessageAt,unreadCount);

@override
String toString() {
  return 'Conversation(id: $id, propertyId: $propertyId, otherUserId: $otherUserId, otherUserName: $otherUserName, otherUserPhoto: $otherUserPhoto, propertyTitle: $propertyTitle, lastMessage: $lastMessage, lastMessageAt: $lastMessageAt, unreadCount: $unreadCount)';
}


}

/// @nodoc
abstract mixin class $ConversationCopyWith<$Res>  {
  factory $ConversationCopyWith(Conversation value, $Res Function(Conversation) _then) = _$ConversationCopyWithImpl;
@useResult
$Res call({
 int id,@JsonKey(name: 'propertyId') int? propertyId,@JsonKey(name: 'otherUserId') int otherUserId,@JsonKey(name: 'otherUserName') String otherUserName,@JsonKey(name: 'otherUserPhoto') String? otherUserPhoto,@JsonKey(name: 'propertyTitle') String? propertyTitle,@JsonKey(name: 'lastMessage') String? lastMessage,@JsonKey(name: 'lastMessageAt') String? lastMessageAt,@JsonKey(name: 'unreadCount') int unreadCount
});




}
/// @nodoc
class _$ConversationCopyWithImpl<$Res>
    implements $ConversationCopyWith<$Res> {
  _$ConversationCopyWithImpl(this._self, this._then);

  final Conversation _self;
  final $Res Function(Conversation) _then;

/// Create a copy of Conversation
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? propertyId = freezed,Object? otherUserId = null,Object? otherUserName = null,Object? otherUserPhoto = freezed,Object? propertyTitle = freezed,Object? lastMessage = freezed,Object? lastMessageAt = freezed,Object? unreadCount = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,propertyId: freezed == propertyId ? _self.propertyId : propertyId // ignore: cast_nullable_to_non_nullable
as int?,otherUserId: null == otherUserId ? _self.otherUserId : otherUserId // ignore: cast_nullable_to_non_nullable
as int,otherUserName: null == otherUserName ? _self.otherUserName : otherUserName // ignore: cast_nullable_to_non_nullable
as String,otherUserPhoto: freezed == otherUserPhoto ? _self.otherUserPhoto : otherUserPhoto // ignore: cast_nullable_to_non_nullable
as String?,propertyTitle: freezed == propertyTitle ? _self.propertyTitle : propertyTitle // ignore: cast_nullable_to_non_nullable
as String?,lastMessage: freezed == lastMessage ? _self.lastMessage : lastMessage // ignore: cast_nullable_to_non_nullable
as String?,lastMessageAt: freezed == lastMessageAt ? _self.lastMessageAt : lastMessageAt // ignore: cast_nullable_to_non_nullable
as String?,unreadCount: null == unreadCount ? _self.unreadCount : unreadCount // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// Adds pattern-matching-related methods to [Conversation].
extension ConversationPatterns on Conversation {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Conversation value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Conversation() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Conversation value)  $default,){
final _that = this;
switch (_that) {
case _Conversation():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Conversation value)?  $default,){
final _that = this;
switch (_that) {
case _Conversation() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int id, @JsonKey(name: 'propertyId')  int? propertyId, @JsonKey(name: 'otherUserId')  int otherUserId, @JsonKey(name: 'otherUserName')  String otherUserName, @JsonKey(name: 'otherUserPhoto')  String? otherUserPhoto, @JsonKey(name: 'propertyTitle')  String? propertyTitle, @JsonKey(name: 'lastMessage')  String? lastMessage, @JsonKey(name: 'lastMessageAt')  String? lastMessageAt, @JsonKey(name: 'unreadCount')  int unreadCount)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Conversation() when $default != null:
return $default(_that.id,_that.propertyId,_that.otherUserId,_that.otherUserName,_that.otherUserPhoto,_that.propertyTitle,_that.lastMessage,_that.lastMessageAt,_that.unreadCount);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int id, @JsonKey(name: 'propertyId')  int? propertyId, @JsonKey(name: 'otherUserId')  int otherUserId, @JsonKey(name: 'otherUserName')  String otherUserName, @JsonKey(name: 'otherUserPhoto')  String? otherUserPhoto, @JsonKey(name: 'propertyTitle')  String? propertyTitle, @JsonKey(name: 'lastMessage')  String? lastMessage, @JsonKey(name: 'lastMessageAt')  String? lastMessageAt, @JsonKey(name: 'unreadCount')  int unreadCount)  $default,) {final _that = this;
switch (_that) {
case _Conversation():
return $default(_that.id,_that.propertyId,_that.otherUserId,_that.otherUserName,_that.otherUserPhoto,_that.propertyTitle,_that.lastMessage,_that.lastMessageAt,_that.unreadCount);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int id, @JsonKey(name: 'propertyId')  int? propertyId, @JsonKey(name: 'otherUserId')  int otherUserId, @JsonKey(name: 'otherUserName')  String otherUserName, @JsonKey(name: 'otherUserPhoto')  String? otherUserPhoto, @JsonKey(name: 'propertyTitle')  String? propertyTitle, @JsonKey(name: 'lastMessage')  String? lastMessage, @JsonKey(name: 'lastMessageAt')  String? lastMessageAt, @JsonKey(name: 'unreadCount')  int unreadCount)?  $default,) {final _that = this;
switch (_that) {
case _Conversation() when $default != null:
return $default(_that.id,_that.propertyId,_that.otherUserId,_that.otherUserName,_that.otherUserPhoto,_that.propertyTitle,_that.lastMessage,_that.lastMessageAt,_that.unreadCount);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _Conversation implements Conversation {
  const _Conversation({required this.id, @JsonKey(name: 'propertyId') this.propertyId, @JsonKey(name: 'otherUserId') required this.otherUserId, @JsonKey(name: 'otherUserName') required this.otherUserName, @JsonKey(name: 'otherUserPhoto') this.otherUserPhoto, @JsonKey(name: 'propertyTitle') this.propertyTitle, @JsonKey(name: 'lastMessage') this.lastMessage, @JsonKey(name: 'lastMessageAt') this.lastMessageAt, @JsonKey(name: 'unreadCount') this.unreadCount = 0});
  factory _Conversation.fromJson(Map<String, dynamic> json) => _$ConversationFromJson(json);

@override final  int id;
@override@JsonKey(name: 'propertyId') final  int? propertyId;
@override@JsonKey(name: 'otherUserId') final  int otherUserId;
@override@JsonKey(name: 'otherUserName') final  String otherUserName;
@override@JsonKey(name: 'otherUserPhoto') final  String? otherUserPhoto;
@override@JsonKey(name: 'propertyTitle') final  String? propertyTitle;
@override@JsonKey(name: 'lastMessage') final  String? lastMessage;
@override@JsonKey(name: 'lastMessageAt') final  String? lastMessageAt;
@override@JsonKey(name: 'unreadCount') final  int unreadCount;

/// Create a copy of Conversation
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ConversationCopyWith<_Conversation> get copyWith => __$ConversationCopyWithImpl<_Conversation>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ConversationToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _Conversation&&(identical(other.id, id) || other.id == id)&&(identical(other.propertyId, propertyId) || other.propertyId == propertyId)&&(identical(other.otherUserId, otherUserId) || other.otherUserId == otherUserId)&&(identical(other.otherUserName, otherUserName) || other.otherUserName == otherUserName)&&(identical(other.otherUserPhoto, otherUserPhoto) || other.otherUserPhoto == otherUserPhoto)&&(identical(other.propertyTitle, propertyTitle) || other.propertyTitle == propertyTitle)&&(identical(other.lastMessage, lastMessage) || other.lastMessage == lastMessage)&&(identical(other.lastMessageAt, lastMessageAt) || other.lastMessageAt == lastMessageAt)&&(identical(other.unreadCount, unreadCount) || other.unreadCount == unreadCount));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,propertyId,otherUserId,otherUserName,otherUserPhoto,propertyTitle,lastMessage,lastMessageAt,unreadCount);

@override
String toString() {
  return 'Conversation(id: $id, propertyId: $propertyId, otherUserId: $otherUserId, otherUserName: $otherUserName, otherUserPhoto: $otherUserPhoto, propertyTitle: $propertyTitle, lastMessage: $lastMessage, lastMessageAt: $lastMessageAt, unreadCount: $unreadCount)';
}


}

/// @nodoc
abstract mixin class _$ConversationCopyWith<$Res> implements $ConversationCopyWith<$Res> {
  factory _$ConversationCopyWith(_Conversation value, $Res Function(_Conversation) _then) = __$ConversationCopyWithImpl;
@override @useResult
$Res call({
 int id,@JsonKey(name: 'propertyId') int? propertyId,@JsonKey(name: 'otherUserId') int otherUserId,@JsonKey(name: 'otherUserName') String otherUserName,@JsonKey(name: 'otherUserPhoto') String? otherUserPhoto,@JsonKey(name: 'propertyTitle') String? propertyTitle,@JsonKey(name: 'lastMessage') String? lastMessage,@JsonKey(name: 'lastMessageAt') String? lastMessageAt,@JsonKey(name: 'unreadCount') int unreadCount
});




}
/// @nodoc
class __$ConversationCopyWithImpl<$Res>
    implements _$ConversationCopyWith<$Res> {
  __$ConversationCopyWithImpl(this._self, this._then);

  final _Conversation _self;
  final $Res Function(_Conversation) _then;

/// Create a copy of Conversation
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? propertyId = freezed,Object? otherUserId = null,Object? otherUserName = null,Object? otherUserPhoto = freezed,Object? propertyTitle = freezed,Object? lastMessage = freezed,Object? lastMessageAt = freezed,Object? unreadCount = null,}) {
  return _then(_Conversation(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,propertyId: freezed == propertyId ? _self.propertyId : propertyId // ignore: cast_nullable_to_non_nullable
as int?,otherUserId: null == otherUserId ? _self.otherUserId : otherUserId // ignore: cast_nullable_to_non_nullable
as int,otherUserName: null == otherUserName ? _self.otherUserName : otherUserName // ignore: cast_nullable_to_non_nullable
as String,otherUserPhoto: freezed == otherUserPhoto ? _self.otherUserPhoto : otherUserPhoto // ignore: cast_nullable_to_non_nullable
as String?,propertyTitle: freezed == propertyTitle ? _self.propertyTitle : propertyTitle // ignore: cast_nullable_to_non_nullable
as String?,lastMessage: freezed == lastMessage ? _self.lastMessage : lastMessage // ignore: cast_nullable_to_non_nullable
as String?,lastMessageAt: freezed == lastMessageAt ? _self.lastMessageAt : lastMessageAt // ignore: cast_nullable_to_non_nullable
as String?,unreadCount: null == unreadCount ? _self.unreadCount : unreadCount // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}


/// @nodoc
mixin _$Message {

 int get id;@JsonKey(name: 'conversationId') int get conversationId;@JsonKey(name: 'senderId') int get senderId;@JsonKey(name: 'content') String get content;@JsonKey(name: 'type') String get type;@JsonKey(name: 'isRead') bool get isRead;@JsonKey(name: 'createdAt') String get createdAt;
/// Create a copy of Message
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$MessageCopyWith<Message> get copyWith => _$MessageCopyWithImpl<Message>(this as Message, _$identity);

  /// Serializes this Message to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Message&&(identical(other.id, id) || other.id == id)&&(identical(other.conversationId, conversationId) || other.conversationId == conversationId)&&(identical(other.senderId, senderId) || other.senderId == senderId)&&(identical(other.content, content) || other.content == content)&&(identical(other.type, type) || other.type == type)&&(identical(other.isRead, isRead) || other.isRead == isRead)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,conversationId,senderId,content,type,isRead,createdAt);

@override
String toString() {
  return 'Message(id: $id, conversationId: $conversationId, senderId: $senderId, content: $content, type: $type, isRead: $isRead, createdAt: $createdAt)';
}


}

/// @nodoc
abstract mixin class $MessageCopyWith<$Res>  {
  factory $MessageCopyWith(Message value, $Res Function(Message) _then) = _$MessageCopyWithImpl;
@useResult
$Res call({
 int id,@JsonKey(name: 'conversationId') int conversationId,@JsonKey(name: 'senderId') int senderId,@JsonKey(name: 'content') String content,@JsonKey(name: 'type') String type,@JsonKey(name: 'isRead') bool isRead,@JsonKey(name: 'createdAt') String createdAt
});




}
/// @nodoc
class _$MessageCopyWithImpl<$Res>
    implements $MessageCopyWith<$Res> {
  _$MessageCopyWithImpl(this._self, this._then);

  final Message _self;
  final $Res Function(Message) _then;

/// Create a copy of Message
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? conversationId = null,Object? senderId = null,Object? content = null,Object? type = null,Object? isRead = null,Object? createdAt = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,conversationId: null == conversationId ? _self.conversationId : conversationId // ignore: cast_nullable_to_non_nullable
as int,senderId: null == senderId ? _self.senderId : senderId // ignore: cast_nullable_to_non_nullable
as int,content: null == content ? _self.content : content // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as String,isRead: null == isRead ? _self.isRead : isRead // ignore: cast_nullable_to_non_nullable
as bool,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [Message].
extension MessagePatterns on Message {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Message value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Message() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Message value)  $default,){
final _that = this;
switch (_that) {
case _Message():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Message value)?  $default,){
final _that = this;
switch (_that) {
case _Message() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int id, @JsonKey(name: 'conversationId')  int conversationId, @JsonKey(name: 'senderId')  int senderId, @JsonKey(name: 'content')  String content, @JsonKey(name: 'type')  String type, @JsonKey(name: 'isRead')  bool isRead, @JsonKey(name: 'createdAt')  String createdAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Message() when $default != null:
return $default(_that.id,_that.conversationId,_that.senderId,_that.content,_that.type,_that.isRead,_that.createdAt);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int id, @JsonKey(name: 'conversationId')  int conversationId, @JsonKey(name: 'senderId')  int senderId, @JsonKey(name: 'content')  String content, @JsonKey(name: 'type')  String type, @JsonKey(name: 'isRead')  bool isRead, @JsonKey(name: 'createdAt')  String createdAt)  $default,) {final _that = this;
switch (_that) {
case _Message():
return $default(_that.id,_that.conversationId,_that.senderId,_that.content,_that.type,_that.isRead,_that.createdAt);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int id, @JsonKey(name: 'conversationId')  int conversationId, @JsonKey(name: 'senderId')  int senderId, @JsonKey(name: 'content')  String content, @JsonKey(name: 'type')  String type, @JsonKey(name: 'isRead')  bool isRead, @JsonKey(name: 'createdAt')  String createdAt)?  $default,) {final _that = this;
switch (_that) {
case _Message() when $default != null:
return $default(_that.id,_that.conversationId,_that.senderId,_that.content,_that.type,_that.isRead,_that.createdAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _Message implements Message {
  const _Message({required this.id, @JsonKey(name: 'conversationId') required this.conversationId, @JsonKey(name: 'senderId') required this.senderId, @JsonKey(name: 'content') required this.content, @JsonKey(name: 'type') this.type = 'text', @JsonKey(name: 'isRead') this.isRead = false, @JsonKey(name: 'createdAt') required this.createdAt});
  factory _Message.fromJson(Map<String, dynamic> json) => _$MessageFromJson(json);

@override final  int id;
@override@JsonKey(name: 'conversationId') final  int conversationId;
@override@JsonKey(name: 'senderId') final  int senderId;
@override@JsonKey(name: 'content') final  String content;
@override@JsonKey(name: 'type') final  String type;
@override@JsonKey(name: 'isRead') final  bool isRead;
@override@JsonKey(name: 'createdAt') final  String createdAt;

/// Create a copy of Message
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$MessageCopyWith<_Message> get copyWith => __$MessageCopyWithImpl<_Message>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$MessageToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _Message&&(identical(other.id, id) || other.id == id)&&(identical(other.conversationId, conversationId) || other.conversationId == conversationId)&&(identical(other.senderId, senderId) || other.senderId == senderId)&&(identical(other.content, content) || other.content == content)&&(identical(other.type, type) || other.type == type)&&(identical(other.isRead, isRead) || other.isRead == isRead)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,conversationId,senderId,content,type,isRead,createdAt);

@override
String toString() {
  return 'Message(id: $id, conversationId: $conversationId, senderId: $senderId, content: $content, type: $type, isRead: $isRead, createdAt: $createdAt)';
}


}

/// @nodoc
abstract mixin class _$MessageCopyWith<$Res> implements $MessageCopyWith<$Res> {
  factory _$MessageCopyWith(_Message value, $Res Function(_Message) _then) = __$MessageCopyWithImpl;
@override @useResult
$Res call({
 int id,@JsonKey(name: 'conversationId') int conversationId,@JsonKey(name: 'senderId') int senderId,@JsonKey(name: 'content') String content,@JsonKey(name: 'type') String type,@JsonKey(name: 'isRead') bool isRead,@JsonKey(name: 'createdAt') String createdAt
});




}
/// @nodoc
class __$MessageCopyWithImpl<$Res>
    implements _$MessageCopyWith<$Res> {
  __$MessageCopyWithImpl(this._self, this._then);

  final _Message _self;
  final $Res Function(_Message) _then;

/// Create a copy of Message
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? conversationId = null,Object? senderId = null,Object? content = null,Object? type = null,Object? isRead = null,Object? createdAt = null,}) {
  return _then(_Message(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,conversationId: null == conversationId ? _self.conversationId : conversationId // ignore: cast_nullable_to_non_nullable
as int,senderId: null == senderId ? _self.senderId : senderId // ignore: cast_nullable_to_non_nullable
as int,content: null == content ? _self.content : content // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as String,isRead: null == isRead ? _self.isRead : isRead // ignore: cast_nullable_to_non_nullable
as bool,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}


/// @nodoc
mixin _$Notification {

 int get id;@JsonKey(name: 'title') String get title;@JsonKey(name: 'message') String get message;@JsonKey(name: 'type') String get type;@JsonKey(name: 'isRead') bool get isRead;@JsonKey(name: 'createdAt') String get createdAt;
/// Create a copy of Notification
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$NotificationCopyWith<Notification> get copyWith => _$NotificationCopyWithImpl<Notification>(this as Notification, _$identity);

  /// Serializes this Notification to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Notification&&(identical(other.id, id) || other.id == id)&&(identical(other.title, title) || other.title == title)&&(identical(other.message, message) || other.message == message)&&(identical(other.type, type) || other.type == type)&&(identical(other.isRead, isRead) || other.isRead == isRead)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,title,message,type,isRead,createdAt);

@override
String toString() {
  return 'Notification(id: $id, title: $title, message: $message, type: $type, isRead: $isRead, createdAt: $createdAt)';
}


}

/// @nodoc
abstract mixin class $NotificationCopyWith<$Res>  {
  factory $NotificationCopyWith(Notification value, $Res Function(Notification) _then) = _$NotificationCopyWithImpl;
@useResult
$Res call({
 int id,@JsonKey(name: 'title') String title,@JsonKey(name: 'message') String message,@JsonKey(name: 'type') String type,@JsonKey(name: 'isRead') bool isRead,@JsonKey(name: 'createdAt') String createdAt
});




}
/// @nodoc
class _$NotificationCopyWithImpl<$Res>
    implements $NotificationCopyWith<$Res> {
  _$NotificationCopyWithImpl(this._self, this._then);

  final Notification _self;
  final $Res Function(Notification) _then;

/// Create a copy of Notification
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? title = null,Object? message = null,Object? type = null,Object? isRead = null,Object? createdAt = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,message: null == message ? _self.message : message // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as String,isRead: null == isRead ? _self.isRead : isRead // ignore: cast_nullable_to_non_nullable
as bool,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [Notification].
extension NotificationPatterns on Notification {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Notification value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Notification() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Notification value)  $default,){
final _that = this;
switch (_that) {
case _Notification():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Notification value)?  $default,){
final _that = this;
switch (_that) {
case _Notification() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int id, @JsonKey(name: 'title')  String title, @JsonKey(name: 'message')  String message, @JsonKey(name: 'type')  String type, @JsonKey(name: 'isRead')  bool isRead, @JsonKey(name: 'createdAt')  String createdAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Notification() when $default != null:
return $default(_that.id,_that.title,_that.message,_that.type,_that.isRead,_that.createdAt);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int id, @JsonKey(name: 'title')  String title, @JsonKey(name: 'message')  String message, @JsonKey(name: 'type')  String type, @JsonKey(name: 'isRead')  bool isRead, @JsonKey(name: 'createdAt')  String createdAt)  $default,) {final _that = this;
switch (_that) {
case _Notification():
return $default(_that.id,_that.title,_that.message,_that.type,_that.isRead,_that.createdAt);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int id, @JsonKey(name: 'title')  String title, @JsonKey(name: 'message')  String message, @JsonKey(name: 'type')  String type, @JsonKey(name: 'isRead')  bool isRead, @JsonKey(name: 'createdAt')  String createdAt)?  $default,) {final _that = this;
switch (_that) {
case _Notification() when $default != null:
return $default(_that.id,_that.title,_that.message,_that.type,_that.isRead,_that.createdAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _Notification implements Notification {
  const _Notification({required this.id, @JsonKey(name: 'title') required this.title, @JsonKey(name: 'message') required this.message, @JsonKey(name: 'type') this.type = 'info', @JsonKey(name: 'isRead') this.isRead = false, @JsonKey(name: 'createdAt') required this.createdAt});
  factory _Notification.fromJson(Map<String, dynamic> json) => _$NotificationFromJson(json);

@override final  int id;
@override@JsonKey(name: 'title') final  String title;
@override@JsonKey(name: 'message') final  String message;
@override@JsonKey(name: 'type') final  String type;
@override@JsonKey(name: 'isRead') final  bool isRead;
@override@JsonKey(name: 'createdAt') final  String createdAt;

/// Create a copy of Notification
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$NotificationCopyWith<_Notification> get copyWith => __$NotificationCopyWithImpl<_Notification>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$NotificationToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _Notification&&(identical(other.id, id) || other.id == id)&&(identical(other.title, title) || other.title == title)&&(identical(other.message, message) || other.message == message)&&(identical(other.type, type) || other.type == type)&&(identical(other.isRead, isRead) || other.isRead == isRead)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,title,message,type,isRead,createdAt);

@override
String toString() {
  return 'Notification(id: $id, title: $title, message: $message, type: $type, isRead: $isRead, createdAt: $createdAt)';
}


}

/// @nodoc
abstract mixin class _$NotificationCopyWith<$Res> implements $NotificationCopyWith<$Res> {
  factory _$NotificationCopyWith(_Notification value, $Res Function(_Notification) _then) = __$NotificationCopyWithImpl;
@override @useResult
$Res call({
 int id,@JsonKey(name: 'title') String title,@JsonKey(name: 'message') String message,@JsonKey(name: 'type') String type,@JsonKey(name: 'isRead') bool isRead,@JsonKey(name: 'createdAt') String createdAt
});




}
/// @nodoc
class __$NotificationCopyWithImpl<$Res>
    implements _$NotificationCopyWith<$Res> {
  __$NotificationCopyWithImpl(this._self, this._then);

  final _Notification _self;
  final $Res Function(_Notification) _then;

/// Create a copy of Notification
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? title = null,Object? message = null,Object? type = null,Object? isRead = null,Object? createdAt = null,}) {
  return _then(_Notification(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,message: null == message ? _self.message : message // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as String,isRead: null == isRead ? _self.isRead : isRead // ignore: cast_nullable_to_non_nullable
as bool,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}


/// @nodoc
mixin _$RentRequest {

 int get id;@JsonKey(name: 'propertyId') int get propertyId;@JsonKey(name: 'tenantId') int get tenantId;@JsonKey(name: 'status') String get status;@JsonKey(name: 'moveInDate') String? get moveInDate;@JsonKey(name: 'duration') int? get duration;@JsonKey(name: 'message') String? get message;@JsonKey(name: 'createdAt') String get createdAt;
/// Create a copy of RentRequest
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$RentRequestCopyWith<RentRequest> get copyWith => _$RentRequestCopyWithImpl<RentRequest>(this as RentRequest, _$identity);

  /// Serializes this RentRequest to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is RentRequest&&(identical(other.id, id) || other.id == id)&&(identical(other.propertyId, propertyId) || other.propertyId == propertyId)&&(identical(other.tenantId, tenantId) || other.tenantId == tenantId)&&(identical(other.status, status) || other.status == status)&&(identical(other.moveInDate, moveInDate) || other.moveInDate == moveInDate)&&(identical(other.duration, duration) || other.duration == duration)&&(identical(other.message, message) || other.message == message)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,propertyId,tenantId,status,moveInDate,duration,message,createdAt);

@override
String toString() {
  return 'RentRequest(id: $id, propertyId: $propertyId, tenantId: $tenantId, status: $status, moveInDate: $moveInDate, duration: $duration, message: $message, createdAt: $createdAt)';
}


}

/// @nodoc
abstract mixin class $RentRequestCopyWith<$Res>  {
  factory $RentRequestCopyWith(RentRequest value, $Res Function(RentRequest) _then) = _$RentRequestCopyWithImpl;
@useResult
$Res call({
 int id,@JsonKey(name: 'propertyId') int propertyId,@JsonKey(name: 'tenantId') int tenantId,@JsonKey(name: 'status') String status,@JsonKey(name: 'moveInDate') String? moveInDate,@JsonKey(name: 'duration') int? duration,@JsonKey(name: 'message') String? message,@JsonKey(name: 'createdAt') String createdAt
});




}
/// @nodoc
class _$RentRequestCopyWithImpl<$Res>
    implements $RentRequestCopyWith<$Res> {
  _$RentRequestCopyWithImpl(this._self, this._then);

  final RentRequest _self;
  final $Res Function(RentRequest) _then;

/// Create a copy of RentRequest
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? propertyId = null,Object? tenantId = null,Object? status = null,Object? moveInDate = freezed,Object? duration = freezed,Object? message = freezed,Object? createdAt = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,propertyId: null == propertyId ? _self.propertyId : propertyId // ignore: cast_nullable_to_non_nullable
as int,tenantId: null == tenantId ? _self.tenantId : tenantId // ignore: cast_nullable_to_non_nullable
as int,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,moveInDate: freezed == moveInDate ? _self.moveInDate : moveInDate // ignore: cast_nullable_to_non_nullable
as String?,duration: freezed == duration ? _self.duration : duration // ignore: cast_nullable_to_non_nullable
as int?,message: freezed == message ? _self.message : message // ignore: cast_nullable_to_non_nullable
as String?,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [RentRequest].
extension RentRequestPatterns on RentRequest {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _RentRequest value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _RentRequest() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _RentRequest value)  $default,){
final _that = this;
switch (_that) {
case _RentRequest():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _RentRequest value)?  $default,){
final _that = this;
switch (_that) {
case _RentRequest() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int id, @JsonKey(name: 'propertyId')  int propertyId, @JsonKey(name: 'tenantId')  int tenantId, @JsonKey(name: 'status')  String status, @JsonKey(name: 'moveInDate')  String? moveInDate, @JsonKey(name: 'duration')  int? duration, @JsonKey(name: 'message')  String? message, @JsonKey(name: 'createdAt')  String createdAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _RentRequest() when $default != null:
return $default(_that.id,_that.propertyId,_that.tenantId,_that.status,_that.moveInDate,_that.duration,_that.message,_that.createdAt);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int id, @JsonKey(name: 'propertyId')  int propertyId, @JsonKey(name: 'tenantId')  int tenantId, @JsonKey(name: 'status')  String status, @JsonKey(name: 'moveInDate')  String? moveInDate, @JsonKey(name: 'duration')  int? duration, @JsonKey(name: 'message')  String? message, @JsonKey(name: 'createdAt')  String createdAt)  $default,) {final _that = this;
switch (_that) {
case _RentRequest():
return $default(_that.id,_that.propertyId,_that.tenantId,_that.status,_that.moveInDate,_that.duration,_that.message,_that.createdAt);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int id, @JsonKey(name: 'propertyId')  int propertyId, @JsonKey(name: 'tenantId')  int tenantId, @JsonKey(name: 'status')  String status, @JsonKey(name: 'moveInDate')  String? moveInDate, @JsonKey(name: 'duration')  int? duration, @JsonKey(name: 'message')  String? message, @JsonKey(name: 'createdAt')  String createdAt)?  $default,) {final _that = this;
switch (_that) {
case _RentRequest() when $default != null:
return $default(_that.id,_that.propertyId,_that.tenantId,_that.status,_that.moveInDate,_that.duration,_that.message,_that.createdAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _RentRequest implements RentRequest {
  const _RentRequest({required this.id, @JsonKey(name: 'propertyId') required this.propertyId, @JsonKey(name: 'tenantId') required this.tenantId, @JsonKey(name: 'status') this.status = 'pending', @JsonKey(name: 'moveInDate') this.moveInDate, @JsonKey(name: 'duration') this.duration, @JsonKey(name: 'message') this.message, @JsonKey(name: 'createdAt') required this.createdAt});
  factory _RentRequest.fromJson(Map<String, dynamic> json) => _$RentRequestFromJson(json);

@override final  int id;
@override@JsonKey(name: 'propertyId') final  int propertyId;
@override@JsonKey(name: 'tenantId') final  int tenantId;
@override@JsonKey(name: 'status') final  String status;
@override@JsonKey(name: 'moveInDate') final  String? moveInDate;
@override@JsonKey(name: 'duration') final  int? duration;
@override@JsonKey(name: 'message') final  String? message;
@override@JsonKey(name: 'createdAt') final  String createdAt;

/// Create a copy of RentRequest
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$RentRequestCopyWith<_RentRequest> get copyWith => __$RentRequestCopyWithImpl<_RentRequest>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$RentRequestToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _RentRequest&&(identical(other.id, id) || other.id == id)&&(identical(other.propertyId, propertyId) || other.propertyId == propertyId)&&(identical(other.tenantId, tenantId) || other.tenantId == tenantId)&&(identical(other.status, status) || other.status == status)&&(identical(other.moveInDate, moveInDate) || other.moveInDate == moveInDate)&&(identical(other.duration, duration) || other.duration == duration)&&(identical(other.message, message) || other.message == message)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,propertyId,tenantId,status,moveInDate,duration,message,createdAt);

@override
String toString() {
  return 'RentRequest(id: $id, propertyId: $propertyId, tenantId: $tenantId, status: $status, moveInDate: $moveInDate, duration: $duration, message: $message, createdAt: $createdAt)';
}


}

/// @nodoc
abstract mixin class _$RentRequestCopyWith<$Res> implements $RentRequestCopyWith<$Res> {
  factory _$RentRequestCopyWith(_RentRequest value, $Res Function(_RentRequest) _then) = __$RentRequestCopyWithImpl;
@override @useResult
$Res call({
 int id,@JsonKey(name: 'propertyId') int propertyId,@JsonKey(name: 'tenantId') int tenantId,@JsonKey(name: 'status') String status,@JsonKey(name: 'moveInDate') String? moveInDate,@JsonKey(name: 'duration') int? duration,@JsonKey(name: 'message') String? message,@JsonKey(name: 'createdAt') String createdAt
});




}
/// @nodoc
class __$RentRequestCopyWithImpl<$Res>
    implements _$RentRequestCopyWith<$Res> {
  __$RentRequestCopyWithImpl(this._self, this._then);

  final _RentRequest _self;
  final $Res Function(_RentRequest) _then;

/// Create a copy of RentRequest
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? propertyId = null,Object? tenantId = null,Object? status = null,Object? moveInDate = freezed,Object? duration = freezed,Object? message = freezed,Object? createdAt = null,}) {
  return _then(_RentRequest(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,propertyId: null == propertyId ? _self.propertyId : propertyId // ignore: cast_nullable_to_non_nullable
as int,tenantId: null == tenantId ? _self.tenantId : tenantId // ignore: cast_nullable_to_non_nullable
as int,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,moveInDate: freezed == moveInDate ? _self.moveInDate : moveInDate // ignore: cast_nullable_to_non_nullable
as String?,duration: freezed == duration ? _self.duration : duration // ignore: cast_nullable_to_non_nullable
as int?,message: freezed == message ? _self.message : message // ignore: cast_nullable_to_non_nullable
as String?,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}


/// @nodoc
mixin _$ExchangeRate {

@JsonKey(name: 'usdToCop') double get usdToCop;@JsonKey(name: 'rate') String get rate;@JsonKey(name: 'updatedAt') String get updatedAt;
/// Create a copy of ExchangeRate
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ExchangeRateCopyWith<ExchangeRate> get copyWith => _$ExchangeRateCopyWithImpl<ExchangeRate>(this as ExchangeRate, _$identity);

  /// Serializes this ExchangeRate to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ExchangeRate&&(identical(other.usdToCop, usdToCop) || other.usdToCop == usdToCop)&&(identical(other.rate, rate) || other.rate == rate)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,usdToCop,rate,updatedAt);

@override
String toString() {
  return 'ExchangeRate(usdToCop: $usdToCop, rate: $rate, updatedAt: $updatedAt)';
}


}

/// @nodoc
abstract mixin class $ExchangeRateCopyWith<$Res>  {
  factory $ExchangeRateCopyWith(ExchangeRate value, $Res Function(ExchangeRate) _then) = _$ExchangeRateCopyWithImpl;
@useResult
$Res call({
@JsonKey(name: 'usdToCop') double usdToCop,@JsonKey(name: 'rate') String rate,@JsonKey(name: 'updatedAt') String updatedAt
});




}
/// @nodoc
class _$ExchangeRateCopyWithImpl<$Res>
    implements $ExchangeRateCopyWith<$Res> {
  _$ExchangeRateCopyWithImpl(this._self, this._then);

  final ExchangeRate _self;
  final $Res Function(ExchangeRate) _then;

/// Create a copy of ExchangeRate
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? usdToCop = null,Object? rate = null,Object? updatedAt = null,}) {
  return _then(_self.copyWith(
usdToCop: null == usdToCop ? _self.usdToCop : usdToCop // ignore: cast_nullable_to_non_nullable
as double,rate: null == rate ? _self.rate : rate // ignore: cast_nullable_to_non_nullable
as String,updatedAt: null == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [ExchangeRate].
extension ExchangeRatePatterns on ExchangeRate {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ExchangeRate value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ExchangeRate() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ExchangeRate value)  $default,){
final _that = this;
switch (_that) {
case _ExchangeRate():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ExchangeRate value)?  $default,){
final _that = this;
switch (_that) {
case _ExchangeRate() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@JsonKey(name: 'usdToCop')  double usdToCop, @JsonKey(name: 'rate')  String rate, @JsonKey(name: 'updatedAt')  String updatedAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ExchangeRate() when $default != null:
return $default(_that.usdToCop,_that.rate,_that.updatedAt);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@JsonKey(name: 'usdToCop')  double usdToCop, @JsonKey(name: 'rate')  String rate, @JsonKey(name: 'updatedAt')  String updatedAt)  $default,) {final _that = this;
switch (_that) {
case _ExchangeRate():
return $default(_that.usdToCop,_that.rate,_that.updatedAt);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@JsonKey(name: 'usdToCop')  double usdToCop, @JsonKey(name: 'rate')  String rate, @JsonKey(name: 'updatedAt')  String updatedAt)?  $default,) {final _that = this;
switch (_that) {
case _ExchangeRate() when $default != null:
return $default(_that.usdToCop,_that.rate,_that.updatedAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ExchangeRate implements ExchangeRate {
  const _ExchangeRate({@JsonKey(name: 'usdToCop') required this.usdToCop, @JsonKey(name: 'rate') this.rate = 'trm', @JsonKey(name: 'updatedAt') required this.updatedAt});
  factory _ExchangeRate.fromJson(Map<String, dynamic> json) => _$ExchangeRateFromJson(json);

@override@JsonKey(name: 'usdToCop') final  double usdToCop;
@override@JsonKey(name: 'rate') final  String rate;
@override@JsonKey(name: 'updatedAt') final  String updatedAt;

/// Create a copy of ExchangeRate
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ExchangeRateCopyWith<_ExchangeRate> get copyWith => __$ExchangeRateCopyWithImpl<_ExchangeRate>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ExchangeRateToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ExchangeRate&&(identical(other.usdToCop, usdToCop) || other.usdToCop == usdToCop)&&(identical(other.rate, rate) || other.rate == rate)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,usdToCop,rate,updatedAt);

@override
String toString() {
  return 'ExchangeRate(usdToCop: $usdToCop, rate: $rate, updatedAt: $updatedAt)';
}


}

/// @nodoc
abstract mixin class _$ExchangeRateCopyWith<$Res> implements $ExchangeRateCopyWith<$Res> {
  factory _$ExchangeRateCopyWith(_ExchangeRate value, $Res Function(_ExchangeRate) _then) = __$ExchangeRateCopyWithImpl;
@override @useResult
$Res call({
@JsonKey(name: 'usdToCop') double usdToCop,@JsonKey(name: 'rate') String rate,@JsonKey(name: 'updatedAt') String updatedAt
});




}
/// @nodoc
class __$ExchangeRateCopyWithImpl<$Res>
    implements _$ExchangeRateCopyWith<$Res> {
  __$ExchangeRateCopyWithImpl(this._self, this._then);

  final _ExchangeRate _self;
  final $Res Function(_ExchangeRate) _then;

/// Create a copy of ExchangeRate
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? usdToCop = null,Object? rate = null,Object? updatedAt = null,}) {
  return _then(_ExchangeRate(
usdToCop: null == usdToCop ? _self.usdToCop : usdToCop // ignore: cast_nullable_to_non_nullable
as double,rate: null == rate ? _self.rate : rate // ignore: cast_nullable_to_non_nullable
as String,updatedAt: null == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
