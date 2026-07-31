import 'package:freezed_annotation/freezed_annotation.dart';

part 'user.freezed.dart';
part 'user.g.dart';

enum UserRole {
  @JsonValue('admin') admin,
  @JsonValue('operator') operator,
  @JsonValue('propietario') owner,
  @JsonValue('estudiante') tenant,
  @JsonValue('cliente') cliente,
}

enum AccountStatus {
  @JsonValue('pending') pending,
  @JsonValue('active') active,
  @JsonValue('suspended') suspended,
  @JsonValue('rejected') rejected,
}

@freezed
abstract class User with _$User {
  const factory User({
    required int id,
    required String name,
    required String email,
    @JsonKey(name: 'role') required String role,
    @JsonKey(name: 'phonePrefix') required String phonePrefix,
    @JsonKey(name: 'phone') required String phone,
    @JsonKey(name: 'cedulaType') required String cedulaType,
    @JsonKey(name: 'cedula') required String cedula,
    @JsonKey(name: 'dateOfBirth') String? dateOfBirth,
    @JsonKey(name: 'gender') String? gender,
    @JsonKey(name: 'isVerified') @Default(false) bool isVerified,
    @JsonKey(name: 'accountStatus') @Default('pending') String accountStatus,
    @JsonKey(name: 'profilePhotoUrl') String? profilePhotoUrl,
    @JsonKey(name: 'address') String? address,
    @JsonKey(name: 'avgRatingAsOwner') double? avgRatingAsOwner,
    @JsonKey(name: 'reviewCountAsOwner') int? reviewCountAsOwner,
    @JsonKey(name: 'avgRatingAsTenant') double? avgRatingAsTenant,
    @JsonKey(name: 'reviewCountAsTenant') int? reviewCountAsTenant,
    @JsonKey(name: 'tutorialCompleted') bool? tutorialCompleted,
    @JsonKey(name: 'createdAt') required String createdAt,
    @JsonKey(name: 'updatedAt') required String updatedAt,
  }) = _User;

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
}
