// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'property.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Property _$PropertyFromJson(Map<String, dynamic> json) => _Property(
  id: (json['id'] as num).toInt(),
  title: json['title'] as String,
  description: json['description'] as String,
  price: (json['price'] as num).toDouble(),
  priceType: json['priceType'] as String,
  priceRate: json['priceRate'] as String?,
  bedrooms: (json['bedrooms'] as num).toInt(),
  bathrooms: (json['bathrooms'] as num).toInt(),
  roomsWithBathroom: (json['roomsWithBathroom'] as num?)?.toInt(),
  outsideBathrooms: (json['outsideBathrooms'] as num?)?.toInt(),
  area: (json['area'] as num).toDouble(),
  type: json['type'] as String,
  furnished: json['furnished'] as bool? ?? false,
  listingType: json['listingType'] as String,
  location: json['location'] as String,
  address: json['address'] as String,
  city: json['city'] as String?,
  state: json['state'] as String?,
  zipCode: json['zipCode'] as String?,
  neighborhood: json['neighborhood'] as String?,
  availableRooms: (json['availableRooms'] as num?)?.toInt(),
  occupiedRooms: (json['occupiedRooms'] as num?)?.toInt(),
  lat: (json['lat'] as num).toDouble(),
  lng: (json['lng'] as num).toDouble(),
  features:
      (json['features'] as List<dynamic>?)?.map((e) => e as String).toList() ??
      const [],
  images:
      (json['images'] as List<dynamic>?)?.map((e) => e as String).toList() ??
      const [],
  mainImage: json['mainImage'] as String?,
  views: (json['views'] as num?)?.toInt() ?? 0,
  isFeatured: json['isFeatured'] as bool? ?? false,
  isActive: json['isActive'] as bool? ?? true,
  ownerId: (json['ownerId'] as num?)?.toInt(),
  createdAt: json['createdAt'] as String,
  updatedAt: json['updatedAt'] as String,
);

Map<String, dynamic> _$PropertyToJson(_Property instance) => <String, dynamic>{
  'id': instance.id,
  'title': instance.title,
  'description': instance.description,
  'price': instance.price,
  'priceType': instance.priceType,
  'priceRate': instance.priceRate,
  'bedrooms': instance.bedrooms,
  'bathrooms': instance.bathrooms,
  'roomsWithBathroom': instance.roomsWithBathroom,
  'outsideBathrooms': instance.outsideBathrooms,
  'area': instance.area,
  'type': instance.type,
  'furnished': instance.furnished,
  'listingType': instance.listingType,
  'location': instance.location,
  'address': instance.address,
  'city': instance.city,
  'state': instance.state,
  'zipCode': instance.zipCode,
  'neighborhood': instance.neighborhood,
  'availableRooms': instance.availableRooms,
  'occupiedRooms': instance.occupiedRooms,
  'lat': instance.lat,
  'lng': instance.lng,
  'features': instance.features,
  'images': instance.images,
  'mainImage': instance.mainImage,
  'views': instance.views,
  'isFeatured': instance.isFeatured,
  'isActive': instance.isActive,
  'ownerId': instance.ownerId,
  'createdAt': instance.createdAt,
  'updatedAt': instance.updatedAt,
};

_PropertyListResponse _$PropertyListResponseFromJson(
  Map<String, dynamic> json,
) => _PropertyListResponse(
  data: (json['data'] as List<dynamic>)
      .map((e) => Property.fromJson(e as Map<String, dynamic>))
      .toList(),
  total: (json['total'] as num).toInt(),
  page: (json['page'] as num).toInt(),
  totalPages: (json['totalPages'] as num).toInt(),
);

Map<String, dynamic> _$PropertyListResponseToJson(
  _PropertyListResponse instance,
) => <String, dynamic>{
  'data': instance.data,
  'total': instance.total,
  'page': instance.page,
  'totalPages': instance.totalPages,
};
