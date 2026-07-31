import 'package:freezed_annotation/freezed_annotation.dart';

part 'property.freezed.dart';
part 'property.g.dart';

@freezed
abstract class Property with _$Property {
  const factory Property({
    required int id,
    required String title,
    required String description,
    required double price,
    @JsonKey(name: 'priceType') required String priceType,
    @JsonKey(name: 'priceRate') String? priceRate,
    @JsonKey(name: 'bedrooms') required int bedrooms,
    @JsonKey(name: 'bathrooms') required int bathrooms,
    @JsonKey(name: 'roomsWithBathroom') int? roomsWithBathroom,
    @JsonKey(name: 'outsideBathrooms') int? outsideBathrooms,
    @JsonKey(name: 'area') required double area,
    @JsonKey(name: 'type') required String type,
    @JsonKey(name: 'furnished') @Default(false) bool furnished,
    @JsonKey(name: 'listingType') required String listingType,
    @JsonKey(name: 'location') required String location,
    @JsonKey(name: 'address') required String address,
    @JsonKey(name: 'city') String? city,
    @JsonKey(name: 'state') String? state,
    @JsonKey(name: 'zipCode') String? zipCode,
    @JsonKey(name: 'neighborhood') String? neighborhood,
    @JsonKey(name: 'availableRooms') int? availableRooms,
    @JsonKey(name: 'occupiedRooms') int? occupiedRooms,
    @JsonKey(name: 'lat') required double lat,
    @JsonKey(name: 'lng') required double lng,
    @JsonKey(name: 'features') @Default([]) List<String> features,
    @JsonKey(name: 'images') @Default([]) List<String> images,
    @JsonKey(name: 'mainImage') String? mainImage,
    @JsonKey(name: 'views') @Default(0) int views,
    @JsonKey(name: 'isFeatured') @Default(false) bool isFeatured,
    @JsonKey(name: 'isActive') @Default(true) bool isActive,
    @JsonKey(name: 'ownerId') int? ownerId,
    @JsonKey(name: 'createdAt') required String createdAt,
    @JsonKey(name: 'updatedAt') required String updatedAt,
  }) = _Property;

  factory Property.fromJson(Map<String, dynamic> json) => _$PropertyFromJson(json);
}

@freezed
abstract class PropertyListResponse with _$PropertyListResponse {
  const factory PropertyListResponse({
    @JsonKey(name: 'data') required List<Property> data,
    @JsonKey(name: 'total') required int total,
    @JsonKey(name: 'page') required int page,
    @JsonKey(name: 'totalPages') required int totalPages,
  }) = _PropertyListResponse;

  factory PropertyListResponse.fromJson(Map<String, dynamic> json) =>
      _$PropertyListResponseFromJson(json);
}
