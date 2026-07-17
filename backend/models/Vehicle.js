const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Vehicle = sequelize.define('Vehicle', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  clientId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  plate: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  chassis: {
    type: DataTypes.STRING,
    allowNull: true
  },
  brand: {
    type: DataTypes.STRING,
    allowNull: false
  },
  model: {
    type: DataTypes.STRING,
    allowNull: false
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fuel: {
    type: DataTypes.ENUM('gasoline', 'ethanol', 'diesel', 'flex', 'hybrid', 'electric', 'other'),
    allowNull: true
  },
  currentKm: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    {
      name: 'vehicles_plate_unique_sparse',
      unique: true,
      fields: ['plate'],
    }
  ]
});

Vehicle.associate = (models) => {
  Vehicle.belongsTo(models.Client, {
    foreignKey: 'clientId',
    as: 'client'
  });
  Vehicle.hasMany(models.ServiceOrder, {
    foreignKey: 'vehicleId',
    as: 'serviceOrders'
  });
};

module.exports = Vehicle;
