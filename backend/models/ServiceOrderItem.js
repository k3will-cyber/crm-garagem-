const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ServiceOrderItem = sequelize.define('ServiceOrderItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  serviceOrderId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  partId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  unitPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
}, {
  timestamps: false
});

ServiceOrderItem.associate = (models) => {
  ServiceOrderItem.belongsTo(models.ServiceOrder, {
    foreignKey: 'serviceOrderId',
    as: 'serviceOrder'
  });
  ServiceOrderItem.belongsTo(models.Part, {
    foreignKey: 'partId',
    as: 'part'
  });
};

module.exports = ServiceOrderItem;