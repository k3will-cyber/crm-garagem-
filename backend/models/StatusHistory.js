const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StatusHistory = sequelize.define('StatusHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  serviceOrderId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  fromStatus: {
    type: DataTypes.STRING,
    allowNull: true
  },
  toStatus: {
    type: DataTypes.STRING,
    allowNull: false
  },
  changedBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  notifySent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: true,
  updatedAt: false // Only createdAt matters for history
});

StatusHistory.associate = (models) => {
  StatusHistory.belongsTo(models.ServiceOrder, {
    foreignKey: 'serviceOrderId',
    as: 'serviceOrder'
  });
  StatusHistory.belongsTo(models.User, {
    foreignKey: 'changedBy',
    as: 'changedByUser'
  });
};

module.exports = StatusHistory;
