// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'user.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$User {

 int get id; String get name; String get email;@JsonKey(name: 'role') String get role;@JsonKey(name: 'phonePrefix') String get phonePrefix;@JsonKey(name: 'phone') String get phone;@JsonKey(name: 'cedulaType') String get cedulaType;@JsonKey(name: 'cedula') String get cedula;@JsonKey(name: 'dateOfBirth') String? get dateOfBirth;@JsonKey(name: 'gender') String? get gender;@JsonKey(name: 'isVerified') bool get isVerified;@JsonKey(name: 'accountStatus') String get accountStatus;@JsonKey(name: 'profilePhotoUrl') String? get profilePhotoUrl;@JsonKey(name: 'address') String? get address;@JsonKey(name: 'avgRatingAsOwner') double? get avgRatingAsOwner;@JsonKey(name: 'reviewCountAsOwner') int? get reviewCountAsOwner;@JsonKey(name: 'avgRatingAsTenant') double? get avgRatingAsTenant;@JsonKey(name: 'reviewCountAsTenant') int? get reviewCountAsTenant;@JsonKey(name: 'tutorialCompleted') bool? get tutorialCompleted;@JsonKey(name: 'createdAt') String get createdAt;@JsonKey(name: 'updatedAt') String get updatedAt;
/// Create a copy of User
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$UserCopyWith<User> get copyWith => _$UserCopyWithImpl<User>(this as User, _$identity);

  /// Serializes this User to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is User&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.email, email) || other.email == email)&&(identical(other.role, role) || other.role == role)&&(identical(other.phonePrefix, phonePrefix) || other.phonePrefix == phonePrefix)&&(identical(other.phone, phone) || other.phone == phone)&&(identical(other.cedulaType, cedulaType) || other.cedulaType == cedulaType)&&(identical(other.cedula, cedula) || other.cedula == cedula)&&(identical(other.dateOfBirth, dateOfBirth) || other.dateOfBirth == dateOfBirth)&&(identical(other.gender, gender) || other.gender == gender)&&(identical(other.isVerified, isVerified) || other.isVerified == isVerified)&&(identical(other.accountStatus, accountStatus) || other.accountStatus == accountStatus)&&(identical(other.profilePhotoUrl, profilePhotoUrl) || other.profilePhotoUrl == profilePhotoUrl)&&(identical(other.address, address) || other.address == address)&&(identical(other.avgRatingAsOwner, avgRatingAsOwner) || other.avgRatingAsOwner == avgRatingAsOwner)&&(identical(other.reviewCountAsOwner, reviewCountAsOwner) || other.reviewCountAsOwner == reviewCountAsOwner)&&(identical(other.avgRatingAsTenant, avgRatingAsTenant) || other.avgRatingAsTenant == avgRatingAsTenant)&&(identical(other.reviewCountAsTenant, reviewCountAsTenant) || other.reviewCountAsTenant == reviewCountAsTenant)&&(identical(other.tutorialCompleted, tutorialCompleted) || other.tutorialCompleted == tutorialCompleted)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hashAll([runtimeType,id,name,email,role,phonePrefix,phone,cedulaType,cedula,dateOfBirth,gender,isVerified,accountStatus,profilePhotoUrl,address,avgRatingAsOwner,reviewCountAsOwner,avgRatingAsTenant,reviewCountAsTenant,tutorialCompleted,createdAt,updatedAt]);

@override
String toString() {
  return 'User(id: $id, name: $name, email: $email, role: $role, phonePrefix: $phonePrefix, phone: $phone, cedulaType: $cedulaType, cedula: $cedula, dateOfBirth: $dateOfBirth, gender: $gender, isVerified: $isVerified, accountStatus: $accountStatus, profilePhotoUrl: $profilePhotoUrl, address: $address, avgRatingAsOwner: $avgRatingAsOwner, reviewCountAsOwner: $reviewCountAsOwner, avgRatingAsTenant: $avgRatingAsTenant, reviewCountAsTenant: $reviewCountAsTenant, tutorialCompleted: $tutorialCompleted, createdAt: $createdAt, updatedAt: $updatedAt)';
}


}

/// @nodoc
abstract mixin class $UserCopyWith<$Res>  {
  factory $UserCopyWith(User value, $Res Function(User) _then) = _$UserCopyWithImpl;
@useResult
$Res call({
 int id, String name, String email,@JsonKey(name: 'role') String role,@JsonKey(name: 'phonePrefix') String phonePrefix,@JsonKey(name: 'phone') String phone,@JsonKey(name: 'cedulaType') String cedulaType,@JsonKey(name: 'cedula') String cedula,@JsonKey(name: 'dateOfBirth') String? dateOfBirth,@JsonKey(name: 'gender') String? gender,@JsonKey(name: 'isVerified') bool isVerified,@JsonKey(name: 'accountStatus') String accountStatus,@JsonKey(name: 'profilePhotoUrl') String? profilePhotoUrl,@JsonKey(name: 'address') String? address,@JsonKey(name: 'avgRatingAsOwner') double? avgRatingAsOwner,@JsonKey(name: 'reviewCountAsOwner') int? reviewCountAsOwner,@JsonKey(name: 'avgRatingAsTenant') double? avgRatingAsTenant,@JsonKey(name: 'reviewCountAsTenant') int? reviewCountAsTenant,@JsonKey(name: 'tutorialCompleted') bool? tutorialCompleted,@JsonKey(name: 'createdAt') String createdAt,@JsonKey(name: 'updatedAt') String updatedAt
});




}
/// @nodoc
class _$UserCopyWithImpl<$Res>
    implements $UserCopyWith<$Res> {
  _$UserCopyWithImpl(this._self, this._then);

  final User _self;
  final $Res Function(User) _then;

/// Create a copy of User
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? name = null,Object? email = null,Object? role = null,Object? phonePrefix = null,Object? phone = null,Object? cedulaType = null,Object? cedula = null,Object? dateOfBirth = freezed,Object? gender = freezed,Object? isVerified = null,Object? accountStatus = null,Object? profilePhotoUrl = freezed,Object? address = freezed,Object? avgRatingAsOwner = freezed,Object? reviewCountAsOwner = freezed,Object? avgRatingAsTenant = freezed,Object? reviewCountAsTenant = freezed,Object? tutorialCompleted = freezed,Object? createdAt = null,Object? updatedAt = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,email: null == email ? _self.email : email // ignore: cast_nullable_to_non_nullable
as String,role: null == role ? _self.role : role // ignore: cast_nullable_to_non_nullable
as String,phonePrefix: null == phonePrefix ? _self.phonePrefix : phonePrefix // ignore: cast_nullable_to_non_nullable
as String,phone: null == phone ? _self.phone : phone // ignore: cast_nullable_to_non_nullable
as String,cedulaType: null == cedulaType ? _self.cedulaType : cedulaType // ignore: cast_nullable_to_non_nullable
as String,cedula: null == cedula ? _self.cedula : cedula // ignore: cast_nullable_to_non_nullable
as String,dateOfBirth: freezed == dateOfBirth ? _self.dateOfBirth : dateOfBirth // ignore: cast_nullable_to_non_nullable
as String?,gender: freezed == gender ? _self.gender : gender // ignore: cast_nullable_to_non_nullable
as String?,isVerified: null == isVerified ? _self.isVerified : isVerified // ignore: cast_nullable_to_non_nullable
as bool,accountStatus: null == accountStatus ? _self.accountStatus : accountStatus // ignore: cast_nullable_to_non_nullable
as String,profilePhotoUrl: freezed == profilePhotoUrl ? _self.profilePhotoUrl : profilePhotoUrl // ignore: cast_nullable_to_non_nullable
as String?,address: freezed == address ? _self.address : address // ignore: cast_nullable_to_non_nullable
as String?,avgRatingAsOwner: freezed == avgRatingAsOwner ? _self.avgRatingAsOwner : avgRatingAsOwner // ignore: cast_nullable_to_non_nullable
as double?,reviewCountAsOwner: freezed == reviewCountAsOwner ? _self.reviewCountAsOwner : reviewCountAsOwner // ignore: cast_nullable_to_non_nullable
as int?,avgRatingAsTenant: freezed == avgRatingAsTenant ? _self.avgRatingAsTenant : avgRatingAsTenant // ignore: cast_nullable_to_non_nullable
as double?,reviewCountAsTenant: freezed == reviewCountAsTenant ? _self.reviewCountAsTenant : reviewCountAsTenant // ignore: cast_nullable_to_non_nullable
as int?,tutorialCompleted: freezed == tutorialCompleted ? _self.tutorialCompleted : tutorialCompleted // ignore: cast_nullable_to_non_nullable
as bool?,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as String,updatedAt: null == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [User].
extension UserPatterns on User {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _User value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _User() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _User value)  $default,){
final _that = this;
switch (_that) {
case _User():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _User value)?  $default,){
final _that = this;
switch (_that) {
case _User() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int id,  String name,  String email, @JsonKey(name: 'role')  String role, @JsonKey(name: 'phonePrefix')  String phonePrefix, @JsonKey(name: 'phone')  String phone, @JsonKey(name: 'cedulaType')  String cedulaType, @JsonKey(name: 'cedula')  String cedula, @JsonKey(name: 'dateOfBirth')  String? dateOfBirth, @JsonKey(name: 'gender')  String? gender, @JsonKey(name: 'isVerified')  bool isVerified, @JsonKey(name: 'accountStatus')  String accountStatus, @JsonKey(name: 'profilePhotoUrl')  String? profilePhotoUrl, @JsonKey(name: 'address')  String? address, @JsonKey(name: 'avgRatingAsOwner')  double? avgRatingAsOwner, @JsonKey(name: 'reviewCountAsOwner')  int? reviewCountAsOwner, @JsonKey(name: 'avgRatingAsTenant')  double? avgRatingAsTenant, @JsonKey(name: 'reviewCountAsTenant')  int? reviewCountAsTenant, @JsonKey(name: 'tutorialCompleted')  bool? tutorialCompleted, @JsonKey(name: 'createdAt')  String createdAt, @JsonKey(name: 'updatedAt')  String updatedAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _User() when $default != null:
return $default(_that.id,_that.name,_that.email,_that.role,_that.phonePrefix,_that.phone,_that.cedulaType,_that.cedula,_that.dateOfBirth,_that.gender,_that.isVerified,_that.accountStatus,_that.profilePhotoUrl,_that.address,_that.avgRatingAsOwner,_that.reviewCountAsOwner,_that.avgRatingAsTenant,_that.reviewCountAsTenant,_that.tutorialCompleted,_that.createdAt,_that.updatedAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int id,  String name,  String email, @JsonKey(name: 'role')  String role, @JsonKey(name: 'phonePrefix')  String phonePrefix, @JsonKey(name: 'phone')  String phone, @JsonKey(name: 'cedulaType')  String cedulaType, @JsonKey(name: 'cedula')  String cedula, @JsonKey(name: 'dateOfBirth')  String? dateOfBirth, @JsonKey(name: 'gender')  String? gender, @JsonKey(name: 'isVerified')  bool isVerified, @JsonKey(name: 'accountStatus')  String accountStatus, @JsonKey(name: 'profilePhotoUrl')  String? profilePhotoUrl, @JsonKey(name: 'address')  String? address, @JsonKey(name: 'avgRatingAsOwner')  double? avgRatingAsOwner, @JsonKey(name: 'reviewCountAsOwner')  int? reviewCountAsOwner, @JsonKey(name: 'avgRatingAsTenant')  double? avgRatingAsTenant, @JsonKey(name: 'reviewCountAsTenant')  int? reviewCountAsTenant, @JsonKey(name: 'tutorialCompleted')  bool? tutorialCompleted, @JsonKey(name: 'createdAt')  String createdAt, @JsonKey(name: 'updatedAt')  String updatedAt)  $default,) {final _that = this;
switch (_that) {
case _User():
return $default(_that.id,_that.name,_that.email,_that.role,_that.phonePrefix,_that.phone,_that.cedulaType,_that.cedula,_that.dateOfBirth,_that.gender,_that.isVerified,_that.accountStatus,_that.profilePhotoUrl,_that.address,_that.avgRatingAsOwner,_that.reviewCountAsOwner,_that.avgRatingAsTenant,_that.reviewCountAsTenant,_that.tutorialCompleted,_that.createdAt,_that.updatedAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int id,  String name,  String email, @JsonKey(name: 'role')  String role, @JsonKey(name: 'phonePrefix')  String phonePrefix, @JsonKey(name: 'phone')  String phone, @JsonKey(name: 'cedulaType')  String cedulaType, @JsonKey(name: 'cedula')  String cedula, @JsonKey(name: 'dateOfBirth')  String? dateOfBirth, @JsonKey(name: 'gender')  String? gender, @JsonKey(name: 'isVerified')  bool isVerified, @JsonKey(name: 'accountStatus')  String accountStatus, @JsonKey(name: 'profilePhotoUrl')  String? profilePhotoUrl, @JsonKey(name: 'address')  String? address, @JsonKey(name: 'avgRatingAsOwner')  double? avgRatingAsOwner, @JsonKey(name: 'reviewCountAsOwner')  int? reviewCountAsOwner, @JsonKey(name: 'avgRatingAsTenant')  double? avgRatingAsTenant, @JsonKey(name: 'reviewCountAsTenant')  int? reviewCountAsTenant, @JsonKey(name: 'tutorialCompleted')  bool? tutorialCompleted, @JsonKey(name: 'createdAt')  String createdAt, @JsonKey(name: 'updatedAt')  String updatedAt)?  $default,) {final _that = this;
switch (_that) {
case _User() when $default != null:
return $default(_that.id,_that.name,_that.email,_that.role,_that.phonePrefix,_that.phone,_that.cedulaType,_that.cedula,_that.dateOfBirth,_that.gender,_that.isVerified,_that.accountStatus,_that.profilePhotoUrl,_that.address,_that.avgRatingAsOwner,_that.reviewCountAsOwner,_that.avgRatingAsTenant,_that.reviewCountAsTenant,_that.tutorialCompleted,_that.createdAt,_that.updatedAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _User implements User {
  const _User({required this.id, required this.name, required this.email, @JsonKey(name: 'role') required this.role, @JsonKey(name: 'phonePrefix') required this.phonePrefix, @JsonKey(name: 'phone') required this.phone, @JsonKey(name: 'cedulaType') required this.cedulaType, @JsonKey(name: 'cedula') required this.cedula, @JsonKey(name: 'dateOfBirth') this.dateOfBirth, @JsonKey(name: 'gender') this.gender, @JsonKey(name: 'isVerified') this.isVerified = false, @JsonKey(name: 'accountStatus') this.accountStatus = 'pending', @JsonKey(name: 'profilePhotoUrl') this.profilePhotoUrl, @JsonKey(name: 'address') this.address, @JsonKey(name: 'avgRatingAsOwner') this.avgRatingAsOwner, @JsonKey(name: 'reviewCountAsOwner') this.reviewCountAsOwner, @JsonKey(name: 'avgRatingAsTenant') this.avgRatingAsTenant, @JsonKey(name: 'reviewCountAsTenant') this.reviewCountAsTenant, @JsonKey(name: 'tutorialCompleted') this.tutorialCompleted, @JsonKey(name: 'createdAt') required this.createdAt, @JsonKey(name: 'updatedAt') required this.updatedAt});
  factory _User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);

@override final  int id;
@override final  String name;
@override final  String email;
@override@JsonKey(name: 'role') final  String role;
@override@JsonKey(name: 'phonePrefix') final  String phonePrefix;
@override@JsonKey(name: 'phone') final  String phone;
@override@JsonKey(name: 'cedulaType') final  String cedulaType;
@override@JsonKey(name: 'cedula') final  String cedula;
@override@JsonKey(name: 'dateOfBirth') final  String? dateOfBirth;
@override@JsonKey(name: 'gender') final  String? gender;
@override@JsonKey(name: 'isVerified') final  bool isVerified;
@override@JsonKey(name: 'accountStatus') final  String accountStatus;
@override@JsonKey(name: 'profilePhotoUrl') final  String? profilePhotoUrl;
@override@JsonKey(name: 'address') final  String? address;
@override@JsonKey(name: 'avgRatingAsOwner') final  double? avgRatingAsOwner;
@override@JsonKey(name: 'reviewCountAsOwner') final  int? reviewCountAsOwner;
@override@JsonKey(name: 'avgRatingAsTenant') final  double? avgRatingAsTenant;
@override@JsonKey(name: 'reviewCountAsTenant') final  int? reviewCountAsTenant;
@override@JsonKey(name: 'tutorialCompleted') final  bool? tutorialCompleted;
@override@JsonKey(name: 'createdAt') final  String createdAt;
@override@JsonKey(name: 'updatedAt') final  String updatedAt;

/// Create a copy of User
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$UserCopyWith<_User> get copyWith => __$UserCopyWithImpl<_User>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$UserToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _User&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.email, email) || other.email == email)&&(identical(other.role, role) || other.role == role)&&(identical(other.phonePrefix, phonePrefix) || other.phonePrefix == phonePrefix)&&(identical(other.phone, phone) || other.phone == phone)&&(identical(other.cedulaType, cedulaType) || other.cedulaType == cedulaType)&&(identical(other.cedula, cedula) || other.cedula == cedula)&&(identical(other.dateOfBirth, dateOfBirth) || other.dateOfBirth == dateOfBirth)&&(identical(other.gender, gender) || other.gender == gender)&&(identical(other.isVerified, isVerified) || other.isVerified == isVerified)&&(identical(other.accountStatus, accountStatus) || other.accountStatus == accountStatus)&&(identical(other.profilePhotoUrl, profilePhotoUrl) || other.profilePhotoUrl == profilePhotoUrl)&&(identical(other.address, address) || other.address == address)&&(identical(other.avgRatingAsOwner, avgRatingAsOwner) || other.avgRatingAsOwner == avgRatingAsOwner)&&(identical(other.reviewCountAsOwner, reviewCountAsOwner) || other.reviewCountAsOwner == reviewCountAsOwner)&&(identical(other.avgRatingAsTenant, avgRatingAsTenant) || other.avgRatingAsTenant == avgRatingAsTenant)&&(identical(other.reviewCountAsTenant, reviewCountAsTenant) || other.reviewCountAsTenant == reviewCountAsTenant)&&(identical(other.tutorialCompleted, tutorialCompleted) || other.tutorialCompleted == tutorialCompleted)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hashAll([runtimeType,id,name,email,role,phonePrefix,phone,cedulaType,cedula,dateOfBirth,gender,isVerified,accountStatus,profilePhotoUrl,address,avgRatingAsOwner,reviewCountAsOwner,avgRatingAsTenant,reviewCountAsTenant,tutorialCompleted,createdAt,updatedAt]);

@override
String toString() {
  return 'User(id: $id, name: $name, email: $email, role: $role, phonePrefix: $phonePrefix, phone: $phone, cedulaType: $cedulaType, cedula: $cedula, dateOfBirth: $dateOfBirth, gender: $gender, isVerified: $isVerified, accountStatus: $accountStatus, profilePhotoUrl: $profilePhotoUrl, address: $address, avgRatingAsOwner: $avgRatingAsOwner, reviewCountAsOwner: $reviewCountAsOwner, avgRatingAsTenant: $avgRatingAsTenant, reviewCountAsTenant: $reviewCountAsTenant, tutorialCompleted: $tutorialCompleted, createdAt: $createdAt, updatedAt: $updatedAt)';
}


}

/// @nodoc
abstract mixin class _$UserCopyWith<$Res> implements $UserCopyWith<$Res> {
  factory _$UserCopyWith(_User value, $Res Function(_User) _then) = __$UserCopyWithImpl;
@override @useResult
$Res call({
 int id, String name, String email,@JsonKey(name: 'role') String role,@JsonKey(name: 'phonePrefix') String phonePrefix,@JsonKey(name: 'phone') String phone,@JsonKey(name: 'cedulaType') String cedulaType,@JsonKey(name: 'cedula') String cedula,@JsonKey(name: 'dateOfBirth') String? dateOfBirth,@JsonKey(name: 'gender') String? gender,@JsonKey(name: 'isVerified') bool isVerified,@JsonKey(name: 'accountStatus') String accountStatus,@JsonKey(name: 'profilePhotoUrl') String? profilePhotoUrl,@JsonKey(name: 'address') String? address,@JsonKey(name: 'avgRatingAsOwner') double? avgRatingAsOwner,@JsonKey(name: 'reviewCountAsOwner') int? reviewCountAsOwner,@JsonKey(name: 'avgRatingAsTenant') double? avgRatingAsTenant,@JsonKey(name: 'reviewCountAsTenant') int? reviewCountAsTenant,@JsonKey(name: 'tutorialCompleted') bool? tutorialCompleted,@JsonKey(name: 'createdAt') String createdAt,@JsonKey(name: 'updatedAt') String updatedAt
});




}
/// @nodoc
class __$UserCopyWithImpl<$Res>
    implements _$UserCopyWith<$Res> {
  __$UserCopyWithImpl(this._self, this._then);

  final _User _self;
  final $Res Function(_User) _then;

/// Create a copy of User
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? name = null,Object? email = null,Object? role = null,Object? phonePrefix = null,Object? phone = null,Object? cedulaType = null,Object? cedula = null,Object? dateOfBirth = freezed,Object? gender = freezed,Object? isVerified = null,Object? accountStatus = null,Object? profilePhotoUrl = freezed,Object? address = freezed,Object? avgRatingAsOwner = freezed,Object? reviewCountAsOwner = freezed,Object? avgRatingAsTenant = freezed,Object? reviewCountAsTenant = freezed,Object? tutorialCompleted = freezed,Object? createdAt = null,Object? updatedAt = null,}) {
  return _then(_User(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,email: null == email ? _self.email : email // ignore: cast_nullable_to_non_nullable
as String,role: null == role ? _self.role : role // ignore: cast_nullable_to_non_nullable
as String,phonePrefix: null == phonePrefix ? _self.phonePrefix : phonePrefix // ignore: cast_nullable_to_non_nullable
as String,phone: null == phone ? _self.phone : phone // ignore: cast_nullable_to_non_nullable
as String,cedulaType: null == cedulaType ? _self.cedulaType : cedulaType // ignore: cast_nullable_to_non_nullable
as String,cedula: null == cedula ? _self.cedula : cedula // ignore: cast_nullable_to_non_nullable
as String,dateOfBirth: freezed == dateOfBirth ? _self.dateOfBirth : dateOfBirth // ignore: cast_nullable_to_non_nullable
as String?,gender: freezed == gender ? _self.gender : gender // ignore: cast_nullable_to_non_nullable
as String?,isVerified: null == isVerified ? _self.isVerified : isVerified // ignore: cast_nullable_to_non_nullable
as bool,accountStatus: null == accountStatus ? _self.accountStatus : accountStatus // ignore: cast_nullable_to_non_nullable
as String,profilePhotoUrl: freezed == profilePhotoUrl ? _self.profilePhotoUrl : profilePhotoUrl // ignore: cast_nullable_to_non_nullable
as String?,address: freezed == address ? _self.address : address // ignore: cast_nullable_to_non_nullable
as String?,avgRatingAsOwner: freezed == avgRatingAsOwner ? _self.avgRatingAsOwner : avgRatingAsOwner // ignore: cast_nullable_to_non_nullable
as double?,reviewCountAsOwner: freezed == reviewCountAsOwner ? _self.reviewCountAsOwner : reviewCountAsOwner // ignore: cast_nullable_to_non_nullable
as int?,avgRatingAsTenant: freezed == avgRatingAsTenant ? _self.avgRatingAsTenant : avgRatingAsTenant // ignore: cast_nullable_to_non_nullable
as double?,reviewCountAsTenant: freezed == reviewCountAsTenant ? _self.reviewCountAsTenant : reviewCountAsTenant // ignore: cast_nullable_to_non_nullable
as int?,tutorialCompleted: freezed == tutorialCompleted ? _self.tutorialCompleted : tutorialCompleted // ignore: cast_nullable_to_non_nullable
as bool?,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as String,updatedAt: null == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
