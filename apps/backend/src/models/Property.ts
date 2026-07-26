import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { PropertyAttributes, PropertyCreationAttributes, PropertyType, ListingType, PropertyStatus } from '../types';
class Property extends Model<PropertyAttributes, PropertyCreationAttributes> implements PropertyAttributes {
  public id!: number;
  public authorId!: number;
  public title!: string;
  public description!: string;

  public type!: PropertyType;
  public listingType!: ListingType;
  public price!: number;
  public priceType!: 'monthly' | 'daily';
  public priceRate!: 'trm';
  
  declare lat: number;
  declare lng: number;
  declare address: string;
  declare location: string;
  declare city: string;
  declare state: string;
  declare zipCode: string;
  declare neighborhood?: string;
  declare availableRooms?: number;
  declare occupiedRooms?: number;
  
  declare bedrooms: number;
  declare bathrooms: number;
  declare roomsWithBathroom?: number;
  declare outsideBathrooms?: number;
  declare area: number;
  declare floor?: number;
  declare totalFloors?: number;
  declare furnished: boolean;
  declare features: string[];
  
  declare status: PropertyStatus;
  declare isVerified: boolean;
  declare verifiedBy?: number | null;
  declare verifiedAt?: Date | null;
  
  declare images: string[];
  declare mainImage: string;
  declare videoUrl?: string;
  
  declare isFeatured: boolean;
  declare views: number;
  declare moderatorId?: number | null;
  declare rejectionReason?: string | null;
  declare avgRating?: number;
  declare reviewCount?: number;

  declare deletedAt?: Date | null;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

(Property as any).init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    authorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM("Residencia", "Apartamento", "Casa", "Cuarto", "Finca", "Local", "Terreno"),
      allowNull: false
    },
    listingType: {
      type: DataTypes.ENUM("Alquiler", "Venta"),
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    priceType: {
      type: DataTypes.ENUM('monthly', 'daily'),
      defaultValue: 'monthly'
    },
    priceRate: {
      type: DataTypes.STRING(20),
      field: 'price_rate',
      defaultValue: 'trm',
      allowNull: false
    },
    lat: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    lng: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: ''
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: ''
    },
    zipCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: ''
    },
    neighborhood: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    availableRooms: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    occupiedRooms: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    bedrooms: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    bathrooms: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    roomsWithBathroom: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    outsideBathrooms: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    area: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    floor: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    totalFloors: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    furnished: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    features: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'rented', 'sold'),
      defaultValue: 'pending'
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    verifiedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    images: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    mainImage: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ''
    },
    videoUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    views: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    moderatorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    avgRating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0,
      field: 'avg_rating'
    },
    reviewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'review_count'
    }
  },
  {
    sequelize,
    tableName: 'properties',
    modelName: 'Property',
    paranoid: true,
    indexes: [
      { name: 'properties_author_idx', fields: ['authorId'] },
      { name: 'properties_status_idx', fields: ['status'] },
      { name: 'properties_price_idx', fields: ['price'] },
      { name: 'properties_type_idx', fields: ['type'] },
      { name: 'properties_moderator_idx', fields: ['moderatorId'] },
      { name: 'properties_featured_idx', fields: ['isFeatured'] },
      { name: 'properties_geo_idx', fields: ['lat', 'lng'] },
      { name: 'properties_location_idx', fields: ['city', 'state', 'neighborhood'] }
    ]
  }
);

// Asegurar que los campos avgRating y reviewCount siempre estén presentes en JSON
Property.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  
  // Asegurar que avgRating y reviewCount estén siempre definidos
  if (values.avgRating === undefined || values.avgRating === null) {
    values.avgRating = 0;
  }
  if (values.reviewCount === undefined || values.reviewCount === null) {
    values.reviewCount = 0;
  }
  
  // Convertir avgRating a número si es una cadena (puede venir como string de la BD)
  if (typeof values.avgRating === 'string') {
    values.avgRating = parseFloat(values.avgRating);
  }
  
  return values;
};

export default Property;
