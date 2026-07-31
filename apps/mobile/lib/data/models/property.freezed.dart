// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'property.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$Property {

 int get id; String get title; String get description; double get price;@JsonKey(name: 'priceType') String get priceType;@JsonKey(name: 'priceRate') String? get priceRate;@JsonKey(name: 'bedrooms') int get bedrooms;@JsonKey(name: 'bathrooms') int get bathrooms;@JsonKey(name: 'roomsWithBathroom') int? get roomsWithBathroom;@JsonKey(name: 'outsideBathrooms') int? get outsideBathrooms;@JsonKey(name: 'area') double get area;@JsonKey(name: 'type') String get type;@JsonKey(name: 'furnished') bool get furnished;@JsonKey(name: 'listingType') String get listingType;@JsonKey(name: 'location') String get location;@JsonKey(name: 'address') String get address;@JsonKey(name: 'city') String? get city;@JsonKey(name: 'state') String? get state;@JsonKey(name: 'zipCode') String? get zipCode;@JsonKey(name: 'neighborhood') String? get neighborhood;@JsonKey(name: 'availableRooms') int? get availableRooms;@JsonKey(name: 'occupiedRooms') int? get occupiedRooms;@JsonKey(name: 'lat') double get lat;@JsonKey(name: 'lng') double get lng;@JsonKey(name: 'features') List<String> get features;@JsonKey(name: 'images') List<String> get images;@JsonKey(name: 'mainImage') String? get mainImage;@JsonKey(name: 'views') int get views;@JsonKey(name: 'isFeatured') bool get isFeatured;@JsonKey(name: 'isActive') bool get isActive;@JsonKey(name: 'ownerId') int? get ownerId;@JsonKey(name: 'createdAt') String get createdAt;@JsonKey(name: 'updatedAt') String get updatedAt;
/// Create a copy of Property
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PropertyCopyWith<Property> get copyWith => _$PropertyCopyWithImpl<Property>(this as Property, _$identity);

  /// Serializes this Property to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Property&&(identical(other.id, id) || other.id == id)&&(identical(other.title, title) || other.title == title)&&(identical(other.description, description) || other.description == description)&&(identical(other.price, price) || other.price == price)&&(identical(other.priceType, priceType) || other.priceType == priceType)&&(identical(other.priceRate, priceRate) || other.priceRate == priceRate)&&(identical(other.bedrooms, bedrooms) || other.bedrooms == bedrooms)&&(identical(other.bathrooms, bathrooms) || other.bathrooms == bathrooms)&&(identical(other.roomsWithBathroom, roomsWithBathroom) || other.roomsWithBathroom == roomsWithBathroom)&&(identical(other.outsideBathrooms, outsideBathrooms) || other.outsideBathrooms == outsideBathrooms)&&(identical(other.area, area) || other.area == area)&&(identical(other.type, type) || other.type == type)&&(identical(other.furnished, furnished) || other.furnished == furnished)&&(identical(other.listingType, listingType) || other.listingType == listingType)&&(identical(other.location, location) || other.location == location)&&(identical(other.address, address) || other.address == address)&&(identical(other.city, city) || other.city == city)&&(identical(other.state, state) || other.state == state)&&(identical(other.zipCode, zipCode) || other.zipCode == zipCode)&&(identical(other.neighborhood, neighborhood) || other.neighborhood == neighborhood)&&(identical(other.availableRooms, availableRooms) || other.availableRooms == availableRooms)&&(identical(other.occupiedRooms, occupiedRooms) || other.occupiedRooms == occupiedRooms)&&(identical(other.lat, lat) || other.lat == lat)&&(identical(other.lng, lng) || other.lng == lng)&&const DeepCollectionEquality().equals(other.features, features)&&const DeepCollectionEquality().equals(other.images, images)&&(identical(other.mainImage, mainImage) || other.mainImage == mainImage)&&(identical(other.views, views) || other.views == views)&&(identical(other.isFeatured, isFeatured) || other.isFeatured == isFeatured)&&(identical(other.isActive, isActive) || other.isActive == isActive)&&(identical(other.ownerId, ownerId) || other.ownerId == ownerId)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hashAll([runtimeType,id,title,description,price,priceType,priceRate,bedrooms,bathrooms,roomsWithBathroom,outsideBathrooms,area,type,furnished,listingType,location,address,city,state,zipCode,neighborhood,availableRooms,occupiedRooms,lat,lng,const DeepCollectionEquality().hash(features),const DeepCollectionEquality().hash(images),mainImage,views,isFeatured,isActive,ownerId,createdAt,updatedAt]);

@override
String toString() {
  return 'Property(id: $id, title: $title, description: $description, price: $price, priceType: $priceType, priceRate: $priceRate, bedrooms: $bedrooms, bathrooms: $bathrooms, roomsWithBathroom: $roomsWithBathroom, outsideBathrooms: $outsideBathrooms, area: $area, type: $type, furnished: $furnished, listingType: $listingType, location: $location, address: $address, city: $city, state: $state, zipCode: $zipCode, neighborhood: $neighborhood, availableRooms: $availableRooms, occupiedRooms: $occupiedRooms, lat: $lat, lng: $lng, features: $features, images: $images, mainImage: $mainImage, views: $views, isFeatured: $isFeatured, isActive: $isActive, ownerId: $ownerId, createdAt: $createdAt, updatedAt: $updatedAt)';
}


}

/// @nodoc
abstract mixin class $PropertyCopyWith<$Res>  {
  factory $PropertyCopyWith(Property value, $Res Function(Property) _then) = _$PropertyCopyWithImpl;
@useResult
$Res call({
 int id, String title, String description, double price,@JsonKey(name: 'priceType') String priceType,@JsonKey(name: 'priceRate') String? priceRate,@JsonKey(name: 'bedrooms') int bedrooms,@JsonKey(name: 'bathrooms') int bathrooms,@JsonKey(name: 'roomsWithBathroom') int? roomsWithBathroom,@JsonKey(name: 'outsideBathrooms') int? outsideBathrooms,@JsonKey(name: 'area') double area,@JsonKey(name: 'type') String type,@JsonKey(name: 'furnished') bool furnished,@JsonKey(name: 'listingType') String listingType,@JsonKey(name: 'location') String location,@JsonKey(name: 'address') String address,@JsonKey(name: 'city') String? city,@JsonKey(name: 'state') String? state,@JsonKey(name: 'zipCode') String? zipCode,@JsonKey(name: 'neighborhood') String? neighborhood,@JsonKey(name: 'availableRooms') int? availableRooms,@JsonKey(name: 'occupiedRooms') int? occupiedRooms,@JsonKey(name: 'lat') double lat,@JsonKey(name: 'lng') double lng,@JsonKey(name: 'features') List<String> features,@JsonKey(name: 'images') List<String> images,@JsonKey(name: 'mainImage') String? mainImage,@JsonKey(name: 'views') int views,@JsonKey(name: 'isFeatured') bool isFeatured,@JsonKey(name: 'isActive') bool isActive,@JsonKey(name: 'ownerId') int? ownerId,@JsonKey(name: 'createdAt') String createdAt,@JsonKey(name: 'updatedAt') String updatedAt
});




}
/// @nodoc
class _$PropertyCopyWithImpl<$Res>
    implements $PropertyCopyWith<$Res> {
  _$PropertyCopyWithImpl(this._self, this._then);

  final Property _self;
  final $Res Function(Property) _then;

/// Create a copy of Property
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? title = null,Object? description = null,Object? price = null,Object? priceType = null,Object? priceRate = freezed,Object? bedrooms = null,Object? bathrooms = null,Object? roomsWithBathroom = freezed,Object? outsideBathrooms = freezed,Object? area = null,Object? type = null,Object? furnished = null,Object? listingType = null,Object? location = null,Object? address = null,Object? city = freezed,Object? state = freezed,Object? zipCode = freezed,Object? neighborhood = freezed,Object? availableRooms = freezed,Object? occupiedRooms = freezed,Object? lat = null,Object? lng = null,Object? features = null,Object? images = null,Object? mainImage = freezed,Object? views = null,Object? isFeatured = null,Object? isActive = null,Object? ownerId = freezed,Object? createdAt = null,Object? updatedAt = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,description: null == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String,price: null == price ? _self.price : price // ignore: cast_nullable_to_non_nullable
as double,priceType: null == priceType ? _self.priceType : priceType // ignore: cast_nullable_to_non_nullable
as String,priceRate: freezed == priceRate ? _self.priceRate : priceRate // ignore: cast_nullable_to_non_nullable
as String?,bedrooms: null == bedrooms ? _self.bedrooms : bedrooms // ignore: cast_nullable_to_non_nullable
as int,bathrooms: null == bathrooms ? _self.bathrooms : bathrooms // ignore: cast_nullable_to_non_nullable
as int,roomsWithBathroom: freezed == roomsWithBathroom ? _self.roomsWithBathroom : roomsWithBathroom // ignore: cast_nullable_to_non_nullable
as int?,outsideBathrooms: freezed == outsideBathrooms ? _self.outsideBathrooms : outsideBathrooms // ignore: cast_nullable_to_non_nullable
as int?,area: null == area ? _self.area : area // ignore: cast_nullable_to_non_nullable
as double,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as String,furnished: null == furnished ? _self.furnished : furnished // ignore: cast_nullable_to_non_nullable
as bool,listingType: null == listingType ? _self.listingType : listingType // ignore: cast_nullable_to_non_nullable
as String,location: null == location ? _self.location : location // ignore: cast_nullable_to_non_nullable
as String,address: null == address ? _self.address : address // ignore: cast_nullable_to_non_nullable
as String,city: freezed == city ? _self.city : city // ignore: cast_nullable_to_non_nullable
as String?,state: freezed == state ? _self.state : state // ignore: cast_nullable_to_non_nullable
as String?,zipCode: freezed == zipCode ? _self.zipCode : zipCode // ignore: cast_nullable_to_non_nullable
as String?,neighborhood: freezed == neighborhood ? _self.neighborhood : neighborhood // ignore: cast_nullable_to_non_nullable
as String?,availableRooms: freezed == availableRooms ? _self.availableRooms : availableRooms // ignore: cast_nullable_to_non_nullable
as int?,occupiedRooms: freezed == occupiedRooms ? _self.occupiedRooms : occupiedRooms // ignore: cast_nullable_to_non_nullable
as int?,lat: null == lat ? _self.lat : lat // ignore: cast_nullable_to_non_nullable
as double,lng: null == lng ? _self.lng : lng // ignore: cast_nullable_to_non_nullable
as double,features: null == features ? _self.features : features // ignore: cast_nullable_to_non_nullable
as List<String>,images: null == images ? _self.images : images // ignore: cast_nullable_to_non_nullable
as List<String>,mainImage: freezed == mainImage ? _self.mainImage : mainImage // ignore: cast_nullable_to_non_nullable
as String?,views: null == views ? _self.views : views // ignore: cast_nullable_to_non_nullable
as int,isFeatured: null == isFeatured ? _self.isFeatured : isFeatured // ignore: cast_nullable_to_non_nullable
as bool,isActive: null == isActive ? _self.isActive : isActive // ignore: cast_nullable_to_non_nullable
as bool,ownerId: freezed == ownerId ? _self.ownerId : ownerId // ignore: cast_nullable_to_non_nullable
as int?,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as String,updatedAt: null == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [Property].
extension PropertyPatterns on Property {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Property value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Property() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Property value)  $default,){
final _that = this;
switch (_that) {
case _Property():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Property value)?  $default,){
final _that = this;
switch (_that) {
case _Property() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int id,  String title,  String description,  double price, @JsonKey(name: 'priceType')  String priceType, @JsonKey(name: 'priceRate')  String? priceRate, @JsonKey(name: 'bedrooms')  int bedrooms, @JsonKey(name: 'bathrooms')  int bathrooms, @JsonKey(name: 'roomsWithBathroom')  int? roomsWithBathroom, @JsonKey(name: 'outsideBathrooms')  int? outsideBathrooms, @JsonKey(name: 'area')  double area, @JsonKey(name: 'type')  String type, @JsonKey(name: 'furnished')  bool furnished, @JsonKey(name: 'listingType')  String listingType, @JsonKey(name: 'location')  String location, @JsonKey(name: 'address')  String address, @JsonKey(name: 'city')  String? city, @JsonKey(name: 'state')  String? state, @JsonKey(name: 'zipCode')  String? zipCode, @JsonKey(name: 'neighborhood')  String? neighborhood, @JsonKey(name: 'availableRooms')  int? availableRooms, @JsonKey(name: 'occupiedRooms')  int? occupiedRooms, @JsonKey(name: 'lat')  double lat, @JsonKey(name: 'lng')  double lng, @JsonKey(name: 'features')  List<String> features, @JsonKey(name: 'images')  List<String> images, @JsonKey(name: 'mainImage')  String? mainImage, @JsonKey(name: 'views')  int views, @JsonKey(name: 'isFeatured')  bool isFeatured, @JsonKey(name: 'isActive')  bool isActive, @JsonKey(name: 'ownerId')  int? ownerId, @JsonKey(name: 'createdAt')  String createdAt, @JsonKey(name: 'updatedAt')  String updatedAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Property() when $default != null:
return $default(_that.id,_that.title,_that.description,_that.price,_that.priceType,_that.priceRate,_that.bedrooms,_that.bathrooms,_that.roomsWithBathroom,_that.outsideBathrooms,_that.area,_that.type,_that.furnished,_that.listingType,_that.location,_that.address,_that.city,_that.state,_that.zipCode,_that.neighborhood,_that.availableRooms,_that.occupiedRooms,_that.lat,_that.lng,_that.features,_that.images,_that.mainImage,_that.views,_that.isFeatured,_that.isActive,_that.ownerId,_that.createdAt,_that.updatedAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int id,  String title,  String description,  double price, @JsonKey(name: 'priceType')  String priceType, @JsonKey(name: 'priceRate')  String? priceRate, @JsonKey(name: 'bedrooms')  int bedrooms, @JsonKey(name: 'bathrooms')  int bathrooms, @JsonKey(name: 'roomsWithBathroom')  int? roomsWithBathroom, @JsonKey(name: 'outsideBathrooms')  int? outsideBathrooms, @JsonKey(name: 'area')  double area, @JsonKey(name: 'type')  String type, @JsonKey(name: 'furnished')  bool furnished, @JsonKey(name: 'listingType')  String listingType, @JsonKey(name: 'location')  String location, @JsonKey(name: 'address')  String address, @JsonKey(name: 'city')  String? city, @JsonKey(name: 'state')  String? state, @JsonKey(name: 'zipCode')  String? zipCode, @JsonKey(name: 'neighborhood')  String? neighborhood, @JsonKey(name: 'availableRooms')  int? availableRooms, @JsonKey(name: 'occupiedRooms')  int? occupiedRooms, @JsonKey(name: 'lat')  double lat, @JsonKey(name: 'lng')  double lng, @JsonKey(name: 'features')  List<String> features, @JsonKey(name: 'images')  List<String> images, @JsonKey(name: 'mainImage')  String? mainImage, @JsonKey(name: 'views')  int views, @JsonKey(name: 'isFeatured')  bool isFeatured, @JsonKey(name: 'isActive')  bool isActive, @JsonKey(name: 'ownerId')  int? ownerId, @JsonKey(name: 'createdAt')  String createdAt, @JsonKey(name: 'updatedAt')  String updatedAt)  $default,) {final _that = this;
switch (_that) {
case _Property():
return $default(_that.id,_that.title,_that.description,_that.price,_that.priceType,_that.priceRate,_that.bedrooms,_that.bathrooms,_that.roomsWithBathroom,_that.outsideBathrooms,_that.area,_that.type,_that.furnished,_that.listingType,_that.location,_that.address,_that.city,_that.state,_that.zipCode,_that.neighborhood,_that.availableRooms,_that.occupiedRooms,_that.lat,_that.lng,_that.features,_that.images,_that.mainImage,_that.views,_that.isFeatured,_that.isActive,_that.ownerId,_that.createdAt,_that.updatedAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int id,  String title,  String description,  double price, @JsonKey(name: 'priceType')  String priceType, @JsonKey(name: 'priceRate')  String? priceRate, @JsonKey(name: 'bedrooms')  int bedrooms, @JsonKey(name: 'bathrooms')  int bathrooms, @JsonKey(name: 'roomsWithBathroom')  int? roomsWithBathroom, @JsonKey(name: 'outsideBathrooms')  int? outsideBathrooms, @JsonKey(name: 'area')  double area, @JsonKey(name: 'type')  String type, @JsonKey(name: 'furnished')  bool furnished, @JsonKey(name: 'listingType')  String listingType, @JsonKey(name: 'location')  String location, @JsonKey(name: 'address')  String address, @JsonKey(name: 'city')  String? city, @JsonKey(name: 'state')  String? state, @JsonKey(name: 'zipCode')  String? zipCode, @JsonKey(name: 'neighborhood')  String? neighborhood, @JsonKey(name: 'availableRooms')  int? availableRooms, @JsonKey(name: 'occupiedRooms')  int? occupiedRooms, @JsonKey(name: 'lat')  double lat, @JsonKey(name: 'lng')  double lng, @JsonKey(name: 'features')  List<String> features, @JsonKey(name: 'images')  List<String> images, @JsonKey(name: 'mainImage')  String? mainImage, @JsonKey(name: 'views')  int views, @JsonKey(name: 'isFeatured')  bool isFeatured, @JsonKey(name: 'isActive')  bool isActive, @JsonKey(name: 'ownerId')  int? ownerId, @JsonKey(name: 'createdAt')  String createdAt, @JsonKey(name: 'updatedAt')  String updatedAt)?  $default,) {final _that = this;
switch (_that) {
case _Property() when $default != null:
return $default(_that.id,_that.title,_that.description,_that.price,_that.priceType,_that.priceRate,_that.bedrooms,_that.bathrooms,_that.roomsWithBathroom,_that.outsideBathrooms,_that.area,_that.type,_that.furnished,_that.listingType,_that.location,_that.address,_that.city,_that.state,_that.zipCode,_that.neighborhood,_that.availableRooms,_that.occupiedRooms,_that.lat,_that.lng,_that.features,_that.images,_that.mainImage,_that.views,_that.isFeatured,_that.isActive,_that.ownerId,_that.createdAt,_that.updatedAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _Property implements Property {
  const _Property({required this.id, required this.title, required this.description, required this.price, @JsonKey(name: 'priceType') required this.priceType, @JsonKey(name: 'priceRate') this.priceRate, @JsonKey(name: 'bedrooms') required this.bedrooms, @JsonKey(name: 'bathrooms') required this.bathrooms, @JsonKey(name: 'roomsWithBathroom') this.roomsWithBathroom, @JsonKey(name: 'outsideBathrooms') this.outsideBathrooms, @JsonKey(name: 'area') required this.area, @JsonKey(name: 'type') required this.type, @JsonKey(name: 'furnished') this.furnished = false, @JsonKey(name: 'listingType') required this.listingType, @JsonKey(name: 'location') required this.location, @JsonKey(name: 'address') required this.address, @JsonKey(name: 'city') this.city, @JsonKey(name: 'state') this.state, @JsonKey(name: 'zipCode') this.zipCode, @JsonKey(name: 'neighborhood') this.neighborhood, @JsonKey(name: 'availableRooms') this.availableRooms, @JsonKey(name: 'occupiedRooms') this.occupiedRooms, @JsonKey(name: 'lat') required this.lat, @JsonKey(name: 'lng') required this.lng, @JsonKey(name: 'features') final  List<String> features = const [], @JsonKey(name: 'images') final  List<String> images = const [], @JsonKey(name: 'mainImage') this.mainImage, @JsonKey(name: 'views') this.views = 0, @JsonKey(name: 'isFeatured') this.isFeatured = false, @JsonKey(name: 'isActive') this.isActive = true, @JsonKey(name: 'ownerId') this.ownerId, @JsonKey(name: 'createdAt') required this.createdAt, @JsonKey(name: 'updatedAt') required this.updatedAt}): _features = features,_images = images;
  factory _Property.fromJson(Map<String, dynamic> json) => _$PropertyFromJson(json);

@override final  int id;
@override final  String title;
@override final  String description;
@override final  double price;
@override@JsonKey(name: 'priceType') final  String priceType;
@override@JsonKey(name: 'priceRate') final  String? priceRate;
@override@JsonKey(name: 'bedrooms') final  int bedrooms;
@override@JsonKey(name: 'bathrooms') final  int bathrooms;
@override@JsonKey(name: 'roomsWithBathroom') final  int? roomsWithBathroom;
@override@JsonKey(name: 'outsideBathrooms') final  int? outsideBathrooms;
@override@JsonKey(name: 'area') final  double area;
@override@JsonKey(name: 'type') final  String type;
@override@JsonKey(name: 'furnished') final  bool furnished;
@override@JsonKey(name: 'listingType') final  String listingType;
@override@JsonKey(name: 'location') final  String location;
@override@JsonKey(name: 'address') final  String address;
@override@JsonKey(name: 'city') final  String? city;
@override@JsonKey(name: 'state') final  String? state;
@override@JsonKey(name: 'zipCode') final  String? zipCode;
@override@JsonKey(name: 'neighborhood') final  String? neighborhood;
@override@JsonKey(name: 'availableRooms') final  int? availableRooms;
@override@JsonKey(name: 'occupiedRooms') final  int? occupiedRooms;
@override@JsonKey(name: 'lat') final  double lat;
@override@JsonKey(name: 'lng') final  double lng;
 final  List<String> _features;
@override@JsonKey(name: 'features') List<String> get features {
  if (_features is EqualUnmodifiableListView) return _features;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_features);
}

 final  List<String> _images;
@override@JsonKey(name: 'images') List<String> get images {
  if (_images is EqualUnmodifiableListView) return _images;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_images);
}

@override@JsonKey(name: 'mainImage') final  String? mainImage;
@override@JsonKey(name: 'views') final  int views;
@override@JsonKey(name: 'isFeatured') final  bool isFeatured;
@override@JsonKey(name: 'isActive') final  bool isActive;
@override@JsonKey(name: 'ownerId') final  int? ownerId;
@override@JsonKey(name: 'createdAt') final  String createdAt;
@override@JsonKey(name: 'updatedAt') final  String updatedAt;

/// Create a copy of Property
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PropertyCopyWith<_Property> get copyWith => __$PropertyCopyWithImpl<_Property>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PropertyToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _Property&&(identical(other.id, id) || other.id == id)&&(identical(other.title, title) || other.title == title)&&(identical(other.description, description) || other.description == description)&&(identical(other.price, price) || other.price == price)&&(identical(other.priceType, priceType) || other.priceType == priceType)&&(identical(other.priceRate, priceRate) || other.priceRate == priceRate)&&(identical(other.bedrooms, bedrooms) || other.bedrooms == bedrooms)&&(identical(other.bathrooms, bathrooms) || other.bathrooms == bathrooms)&&(identical(other.roomsWithBathroom, roomsWithBathroom) || other.roomsWithBathroom == roomsWithBathroom)&&(identical(other.outsideBathrooms, outsideBathrooms) || other.outsideBathrooms == outsideBathrooms)&&(identical(other.area, area) || other.area == area)&&(identical(other.type, type) || other.type == type)&&(identical(other.furnished, furnished) || other.furnished == furnished)&&(identical(other.listingType, listingType) || other.listingType == listingType)&&(identical(other.location, location) || other.location == location)&&(identical(other.address, address) || other.address == address)&&(identical(other.city, city) || other.city == city)&&(identical(other.state, state) || other.state == state)&&(identical(other.zipCode, zipCode) || other.zipCode == zipCode)&&(identical(other.neighborhood, neighborhood) || other.neighborhood == neighborhood)&&(identical(other.availableRooms, availableRooms) || other.availableRooms == availableRooms)&&(identical(other.occupiedRooms, occupiedRooms) || other.occupiedRooms == occupiedRooms)&&(identical(other.lat, lat) || other.lat == lat)&&(identical(other.lng, lng) || other.lng == lng)&&const DeepCollectionEquality().equals(other._features, _features)&&const DeepCollectionEquality().equals(other._images, _images)&&(identical(other.mainImage, mainImage) || other.mainImage == mainImage)&&(identical(other.views, views) || other.views == views)&&(identical(other.isFeatured, isFeatured) || other.isFeatured == isFeatured)&&(identical(other.isActive, isActive) || other.isActive == isActive)&&(identical(other.ownerId, ownerId) || other.ownerId == ownerId)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hashAll([runtimeType,id,title,description,price,priceType,priceRate,bedrooms,bathrooms,roomsWithBathroom,outsideBathrooms,area,type,furnished,listingType,location,address,city,state,zipCode,neighborhood,availableRooms,occupiedRooms,lat,lng,const DeepCollectionEquality().hash(_features),const DeepCollectionEquality().hash(_images),mainImage,views,isFeatured,isActive,ownerId,createdAt,updatedAt]);

@override
String toString() {
  return 'Property(id: $id, title: $title, description: $description, price: $price, priceType: $priceType, priceRate: $priceRate, bedrooms: $bedrooms, bathrooms: $bathrooms, roomsWithBathroom: $roomsWithBathroom, outsideBathrooms: $outsideBathrooms, area: $area, type: $type, furnished: $furnished, listingType: $listingType, location: $location, address: $address, city: $city, state: $state, zipCode: $zipCode, neighborhood: $neighborhood, availableRooms: $availableRooms, occupiedRooms: $occupiedRooms, lat: $lat, lng: $lng, features: $features, images: $images, mainImage: $mainImage, views: $views, isFeatured: $isFeatured, isActive: $isActive, ownerId: $ownerId, createdAt: $createdAt, updatedAt: $updatedAt)';
}


}

/// @nodoc
abstract mixin class _$PropertyCopyWith<$Res> implements $PropertyCopyWith<$Res> {
  factory _$PropertyCopyWith(_Property value, $Res Function(_Property) _then) = __$PropertyCopyWithImpl;
@override @useResult
$Res call({
 int id, String title, String description, double price,@JsonKey(name: 'priceType') String priceType,@JsonKey(name: 'priceRate') String? priceRate,@JsonKey(name: 'bedrooms') int bedrooms,@JsonKey(name: 'bathrooms') int bathrooms,@JsonKey(name: 'roomsWithBathroom') int? roomsWithBathroom,@JsonKey(name: 'outsideBathrooms') int? outsideBathrooms,@JsonKey(name: 'area') double area,@JsonKey(name: 'type') String type,@JsonKey(name: 'furnished') bool furnished,@JsonKey(name: 'listingType') String listingType,@JsonKey(name: 'location') String location,@JsonKey(name: 'address') String address,@JsonKey(name: 'city') String? city,@JsonKey(name: 'state') String? state,@JsonKey(name: 'zipCode') String? zipCode,@JsonKey(name: 'neighborhood') String? neighborhood,@JsonKey(name: 'availableRooms') int? availableRooms,@JsonKey(name: 'occupiedRooms') int? occupiedRooms,@JsonKey(name: 'lat') double lat,@JsonKey(name: 'lng') double lng,@JsonKey(name: 'features') List<String> features,@JsonKey(name: 'images') List<String> images,@JsonKey(name: 'mainImage') String? mainImage,@JsonKey(name: 'views') int views,@JsonKey(name: 'isFeatured') bool isFeatured,@JsonKey(name: 'isActive') bool isActive,@JsonKey(name: 'ownerId') int? ownerId,@JsonKey(name: 'createdAt') String createdAt,@JsonKey(name: 'updatedAt') String updatedAt
});




}
/// @nodoc
class __$PropertyCopyWithImpl<$Res>
    implements _$PropertyCopyWith<$Res> {
  __$PropertyCopyWithImpl(this._self, this._then);

  final _Property _self;
  final $Res Function(_Property) _then;

/// Create a copy of Property
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? title = null,Object? description = null,Object? price = null,Object? priceType = null,Object? priceRate = freezed,Object? bedrooms = null,Object? bathrooms = null,Object? roomsWithBathroom = freezed,Object? outsideBathrooms = freezed,Object? area = null,Object? type = null,Object? furnished = null,Object? listingType = null,Object? location = null,Object? address = null,Object? city = freezed,Object? state = freezed,Object? zipCode = freezed,Object? neighborhood = freezed,Object? availableRooms = freezed,Object? occupiedRooms = freezed,Object? lat = null,Object? lng = null,Object? features = null,Object? images = null,Object? mainImage = freezed,Object? views = null,Object? isFeatured = null,Object? isActive = null,Object? ownerId = freezed,Object? createdAt = null,Object? updatedAt = null,}) {
  return _then(_Property(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,description: null == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String,price: null == price ? _self.price : price // ignore: cast_nullable_to_non_nullable
as double,priceType: null == priceType ? _self.priceType : priceType // ignore: cast_nullable_to_non_nullable
as String,priceRate: freezed == priceRate ? _self.priceRate : priceRate // ignore: cast_nullable_to_non_nullable
as String?,bedrooms: null == bedrooms ? _self.bedrooms : bedrooms // ignore: cast_nullable_to_non_nullable
as int,bathrooms: null == bathrooms ? _self.bathrooms : bathrooms // ignore: cast_nullable_to_non_nullable
as int,roomsWithBathroom: freezed == roomsWithBathroom ? _self.roomsWithBathroom : roomsWithBathroom // ignore: cast_nullable_to_non_nullable
as int?,outsideBathrooms: freezed == outsideBathrooms ? _self.outsideBathrooms : outsideBathrooms // ignore: cast_nullable_to_non_nullable
as int?,area: null == area ? _self.area : area // ignore: cast_nullable_to_non_nullable
as double,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as String,furnished: null == furnished ? _self.furnished : furnished // ignore: cast_nullable_to_non_nullable
as bool,listingType: null == listingType ? _self.listingType : listingType // ignore: cast_nullable_to_non_nullable
as String,location: null == location ? _self.location : location // ignore: cast_nullable_to_non_nullable
as String,address: null == address ? _self.address : address // ignore: cast_nullable_to_non_nullable
as String,city: freezed == city ? _self.city : city // ignore: cast_nullable_to_non_nullable
as String?,state: freezed == state ? _self.state : state // ignore: cast_nullable_to_non_nullable
as String?,zipCode: freezed == zipCode ? _self.zipCode : zipCode // ignore: cast_nullable_to_non_nullable
as String?,neighborhood: freezed == neighborhood ? _self.neighborhood : neighborhood // ignore: cast_nullable_to_non_nullable
as String?,availableRooms: freezed == availableRooms ? _self.availableRooms : availableRooms // ignore: cast_nullable_to_non_nullable
as int?,occupiedRooms: freezed == occupiedRooms ? _self.occupiedRooms : occupiedRooms // ignore: cast_nullable_to_non_nullable
as int?,lat: null == lat ? _self.lat : lat // ignore: cast_nullable_to_non_nullable
as double,lng: null == lng ? _self.lng : lng // ignore: cast_nullable_to_non_nullable
as double,features: null == features ? _self._features : features // ignore: cast_nullable_to_non_nullable
as List<String>,images: null == images ? _self._images : images // ignore: cast_nullable_to_non_nullable
as List<String>,mainImage: freezed == mainImage ? _self.mainImage : mainImage // ignore: cast_nullable_to_non_nullable
as String?,views: null == views ? _self.views : views // ignore: cast_nullable_to_non_nullable
as int,isFeatured: null == isFeatured ? _self.isFeatured : isFeatured // ignore: cast_nullable_to_non_nullable
as bool,isActive: null == isActive ? _self.isActive : isActive // ignore: cast_nullable_to_non_nullable
as bool,ownerId: freezed == ownerId ? _self.ownerId : ownerId // ignore: cast_nullable_to_non_nullable
as int?,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as String,updatedAt: null == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}


/// @nodoc
mixin _$PropertyListResponse {

@JsonKey(name: 'data') List<Property> get data;@JsonKey(name: 'total') int get total;@JsonKey(name: 'page') int get page;@JsonKey(name: 'totalPages') int get totalPages;
/// Create a copy of PropertyListResponse
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PropertyListResponseCopyWith<PropertyListResponse> get copyWith => _$PropertyListResponseCopyWithImpl<PropertyListResponse>(this as PropertyListResponse, _$identity);

  /// Serializes this PropertyListResponse to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PropertyListResponse&&const DeepCollectionEquality().equals(other.data, data)&&(identical(other.total, total) || other.total == total)&&(identical(other.page, page) || other.page == page)&&(identical(other.totalPages, totalPages) || other.totalPages == totalPages));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(data),total,page,totalPages);

@override
String toString() {
  return 'PropertyListResponse(data: $data, total: $total, page: $page, totalPages: $totalPages)';
}


}

/// @nodoc
abstract mixin class $PropertyListResponseCopyWith<$Res>  {
  factory $PropertyListResponseCopyWith(PropertyListResponse value, $Res Function(PropertyListResponse) _then) = _$PropertyListResponseCopyWithImpl;
@useResult
$Res call({
@JsonKey(name: 'data') List<Property> data,@JsonKey(name: 'total') int total,@JsonKey(name: 'page') int page,@JsonKey(name: 'totalPages') int totalPages
});




}
/// @nodoc
class _$PropertyListResponseCopyWithImpl<$Res>
    implements $PropertyListResponseCopyWith<$Res> {
  _$PropertyListResponseCopyWithImpl(this._self, this._then);

  final PropertyListResponse _self;
  final $Res Function(PropertyListResponse) _then;

/// Create a copy of PropertyListResponse
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? data = null,Object? total = null,Object? page = null,Object? totalPages = null,}) {
  return _then(_self.copyWith(
data: null == data ? _self.data : data // ignore: cast_nullable_to_non_nullable
as List<Property>,total: null == total ? _self.total : total // ignore: cast_nullable_to_non_nullable
as int,page: null == page ? _self.page : page // ignore: cast_nullable_to_non_nullable
as int,totalPages: null == totalPages ? _self.totalPages : totalPages // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// Adds pattern-matching-related methods to [PropertyListResponse].
extension PropertyListResponsePatterns on PropertyListResponse {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PropertyListResponse value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PropertyListResponse() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PropertyListResponse value)  $default,){
final _that = this;
switch (_that) {
case _PropertyListResponse():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PropertyListResponse value)?  $default,){
final _that = this;
switch (_that) {
case _PropertyListResponse() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@JsonKey(name: 'data')  List<Property> data, @JsonKey(name: 'total')  int total, @JsonKey(name: 'page')  int page, @JsonKey(name: 'totalPages')  int totalPages)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PropertyListResponse() when $default != null:
return $default(_that.data,_that.total,_that.page,_that.totalPages);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@JsonKey(name: 'data')  List<Property> data, @JsonKey(name: 'total')  int total, @JsonKey(name: 'page')  int page, @JsonKey(name: 'totalPages')  int totalPages)  $default,) {final _that = this;
switch (_that) {
case _PropertyListResponse():
return $default(_that.data,_that.total,_that.page,_that.totalPages);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@JsonKey(name: 'data')  List<Property> data, @JsonKey(name: 'total')  int total, @JsonKey(name: 'page')  int page, @JsonKey(name: 'totalPages')  int totalPages)?  $default,) {final _that = this;
switch (_that) {
case _PropertyListResponse() when $default != null:
return $default(_that.data,_that.total,_that.page,_that.totalPages);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _PropertyListResponse implements PropertyListResponse {
  const _PropertyListResponse({@JsonKey(name: 'data') required final  List<Property> data, @JsonKey(name: 'total') required this.total, @JsonKey(name: 'page') required this.page, @JsonKey(name: 'totalPages') required this.totalPages}): _data = data;
  factory _PropertyListResponse.fromJson(Map<String, dynamic> json) => _$PropertyListResponseFromJson(json);

 final  List<Property> _data;
@override@JsonKey(name: 'data') List<Property> get data {
  if (_data is EqualUnmodifiableListView) return _data;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_data);
}

@override@JsonKey(name: 'total') final  int total;
@override@JsonKey(name: 'page') final  int page;
@override@JsonKey(name: 'totalPages') final  int totalPages;

/// Create a copy of PropertyListResponse
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PropertyListResponseCopyWith<_PropertyListResponse> get copyWith => __$PropertyListResponseCopyWithImpl<_PropertyListResponse>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PropertyListResponseToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _PropertyListResponse&&const DeepCollectionEquality().equals(other._data, _data)&&(identical(other.total, total) || other.total == total)&&(identical(other.page, page) || other.page == page)&&(identical(other.totalPages, totalPages) || other.totalPages == totalPages));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(_data),total,page,totalPages);

@override
String toString() {
  return 'PropertyListResponse(data: $data, total: $total, page: $page, totalPages: $totalPages)';
}


}

/// @nodoc
abstract mixin class _$PropertyListResponseCopyWith<$Res> implements $PropertyListResponseCopyWith<$Res> {
  factory _$PropertyListResponseCopyWith(_PropertyListResponse value, $Res Function(_PropertyListResponse) _then) = __$PropertyListResponseCopyWithImpl;
@override @useResult
$Res call({
@JsonKey(name: 'data') List<Property> data,@JsonKey(name: 'total') int total,@JsonKey(name: 'page') int page,@JsonKey(name: 'totalPages') int totalPages
});




}
/// @nodoc
class __$PropertyListResponseCopyWithImpl<$Res>
    implements _$PropertyListResponseCopyWith<$Res> {
  __$PropertyListResponseCopyWithImpl(this._self, this._then);

  final _PropertyListResponse _self;
  final $Res Function(_PropertyListResponse) _then;

/// Create a copy of PropertyListResponse
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? data = null,Object? total = null,Object? page = null,Object? totalPages = null,}) {
  return _then(_PropertyListResponse(
data: null == data ? _self._data : data // ignore: cast_nullable_to_non_nullable
as List<Property>,total: null == total ? _self.total : total // ignore: cast_nullable_to_non_nullable
as int,page: null == page ? _self.page : page // ignore: cast_nullable_to_non_nullable
as int,totalPages: null == totalPages ? _self.totalPages : totalPages // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}

// dart format on
