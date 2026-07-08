const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ServiceType = sequelize.define('ServiceType', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  basePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  }
}, {
  timestamps: false
});

ServiceType.associate = (models) => {
  ServiceType.hasMany(models.ServiceOrder, {
    foreignKey: 'serviceTypeId',
    as: 'serviceOrders'
  });
};

module.exports = ServiceType;