const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Part = sequelize.define('Part', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  sku: {
    type: DataTypes.STRING,
    unique: true
  },
  description: {
    type: DataTypes.TEXT
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  stockQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  minStockLevel: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  supplier: {
    type: DataTypes.STRING
  }
}, {
  timestamps: true
});

Part.associate = (models) => {
  Part.hasMany(models.ServiceOrderItem, {
    foreignKey: 'partId',
    as: 'serviceOrderItems'
  });
};

module.exports = Part;