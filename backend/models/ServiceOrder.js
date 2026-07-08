const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ServiceOrder = sequelize.define('ServiceOrder', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  clientId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  serviceTypeId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.ENUM('draft', 'scheduled', 'in-progress', 'completed', 'delivered', 'cancelled'),
    defaultValue: 'draft'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium'
  },
  scheduledDate: {
    type: DataTypes.DATE
  },
  completionDate: {
    type: DataTypes.DATE
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  notes: {
    type: DataTypes.TEXT
  },
  shareToken: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    unique: true
  },
  notifyClient: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true
});

ServiceOrder.associate = (models) => {
  ServiceOrder.belongsTo(models.Client, {
    foreignKey: 'clientId',
    as: 'client'
  });
  ServiceOrder.belongsTo(models.ServiceType, {
    foreignKey: 'serviceTypeId',
    as: 'serviceType'
  });
  ServiceOrder.hasMany(models.ServiceOrderItem, {
    foreignKey: 'serviceOrderId',
    as: 'items'
  });
  ServiceOrder.hasMany(models.StatusHistory, {
    foreignKey: 'serviceOrderId',
    as: 'statusHistory'
  });
};

module.exports = ServiceOrder;