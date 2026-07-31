// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_User _$UserFromJson(Map<String, dynamic> json) => _User(
  id: (json['id'] as num).toInt(),
  name: json['name'] as String,
  email: json['email'] as String,
  role: json['role'] as String,
  phonePrefix: json['phonePrefix'] as String,
  phone: json['phone'] as String,
  cedulaType: json['cedulaType'] as String,
  cedula: json['cedula'] as String,
  dateOfBirth: json['dateOfBirth'] as String?,
  gender: json['gender'] as String?,
  isVerified: json['isVerified'] as bool? ?? false,
  accountStatus: json['accountStatus'] as String? ?? 'pending',
  profilePhotoUrl: json['profilePhotoUrl'] as String?,
  address: json['address'] as String?,
  avgRatingAsOwner: (json['avgRatingAsOwner'] as num?)?.toDouble(),
  reviewCountAsOwner: (json['reviewCountAsOwner'] as num?)?.toInt(),
  avgRatingAsTenant: (json['avgRatingAsTenant'] as num?)?.toDouble(),
  reviewCountAsTenant: (json['reviewCountAsTenant'] as num?)?.toInt(),
  tutorialCompleted: json['tutorialCompleted'] as bool?,
  createdAt: json['createdAt'] as String,
  updatedAt: json['updatedAt'] as String,
);

Map<String, dynamic> _$UserToJson(_User instance) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'email': instance.email,
  'role': instance.role,
  'phonePrefix': instance.phonePrefix,
  'phone': instance.phone,
  'cedulaType': instance.cedulaType,
  'cedula': instance.cedula,
  'dateOfBirth': instance.dateOfBirth,
  'gender': instance.gender,
  'isVerified': instance.isVerified,
  'accountStatus': instance.accountStatus,
  'profilePhotoUrl': instance.profilePhotoUrl,
  'address': instance.address,
  'avgRatingAsOwner': instance.avgRatingAsOwner,
  'reviewCountAsOwner': instance.reviewCountAsOwner,
  'avgRatingAsTenant': instance.avgRatingAsTenant,
  'reviewCountAsTenant': instance.reviewCountAsTenant,
  'tutorialCompleted': instance.tutorialCompleted,
  'createdAt': instance.createdAt,
  'updatedAt': instance.updatedAt,
};
