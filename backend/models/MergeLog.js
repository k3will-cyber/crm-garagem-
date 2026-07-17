const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MergeLog = sequelize.define('MergeLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  primaryId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  mergedIds: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  source: {
    type: DataTypes.STRING,
    defaultValue: 'manual'
  },
  mergedBy: {
    type: DataTypes.STRING,
    allowNull: true
  },
  mergedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'merge_logs',
  timestamps: false
});

MergeLog.associate = (models) => {
  MergeLog.belongsTo(models.Client, {
    foreignKey: 'primaryId',
    as: 'primaryClient'
  });
};

module.exports = MergeLog;
