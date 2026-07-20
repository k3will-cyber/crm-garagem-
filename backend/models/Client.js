const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Client = sequelize.define('Client', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING
  },
  email: {
    type: DataTypes.STRING,
    unique: true
  },
  password: {
    type: DataTypes.STRING
  },
  address: {
    type: DataTypes.TEXT
  },
  notes: {
    type: DataTypes.TEXT
  },
  cpfCnpj: {
    type: DataTypes.STRING,
    allowNull: true
  },
  whatsapp: {
    type: DataTypes.STRING,
    allowNull: true
  },
  birthDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  driverType: {
    type: DataTypes.ENUM('convencional', 'app_uber', 'app_99', 'app_outro'),
    defaultValue: 'convencional',
    allowNull: true
  }
}, {
  timestamps: true
});

Client.associate = (models) => {
  Client.hasMany(models.ServiceOrder, {
    foreignKey: 'clientId',
    as: 'serviceOrders'
  });
  Client.hasMany(models.Vehicle, {
    foreignKey: 'clientId',
    as: 'vehicles'
  });
};

module.exports = Client;