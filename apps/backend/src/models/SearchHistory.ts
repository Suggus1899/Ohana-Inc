import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { SearchHistoryAttributes, SearchHistoryCreationAttributes } from '../types';

class SearchHistory extends Model<SearchHistoryAttributes, SearchHistoryCreationAttributes> implements SearchHistoryAttributes {
  public id!: number;
  public userId!: number | null;
  public sessionId!: string;
  public searchQuery?: string;
  public filters!: object;
  public resultCount!: number;
  public clickedResults!: number[];
  public timestamp!: Date;
}

SearchHistory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    sessionId: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    searchQuery: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    filters: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    resultCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    clickedResults: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'search_histories',
    modelName: 'SearchHistory',
    timestamps: false,
    indexes: [
      { name: 'search_history_session_idx', fields: ['sessionId'] },
      { name: 'search_history_timestamp_idx', fields: ['timestamp'] }
    ]
  }
);

export default SearchHistory;
