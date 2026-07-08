const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StockMovement = sequelize.define('StockMovement', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  partId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('in', 'out'),
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  reason: {
    type: DataTypes.ENUM('purchase', 'sale', 'service_order', 'adjustment', 'return', 'part_request'),
    allowNull: false
  },
  referenceType: {
    type: DataTypes.STRING
  },
  referenceId: {
    type: DataTypes.INTEGER
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: true,
  updatedAt: false
});

StockMovement.associate = (models) => {
  StockMovement.belongsTo(models.Part, {
    foreignKey: 'partId',
    as: 'part'
  });
  StockMovement.belongsTo(models.User, {
    foreignKey: 'createdBy',
    as: 'createdByUser'
  });
};

module.exports = StockMovement;
