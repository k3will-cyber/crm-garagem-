const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Lead = sequelize.define('Lead', {
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
    type: DataTypes.STRING
  },
  source: {
    type: DataTypes.STRING // e.g., 'referral', 'facebook', 'google', 'walk-in'
  },
  status: {
    type: DataTypes.ENUM('new', 'contacted', 'quoted', 'won', 'lost'),
    defaultValue: 'new'
  },
  estimatedValue: {
    type: DataTypes.FLOAT
  },
  notes: {
    type: DataTypes.TEXT
  }
});

module.exports = Lead;