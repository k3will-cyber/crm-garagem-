const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DailyDeal = sequelize.define('DailyDeal', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  discountPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0
  },
  serviceTypeId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  partId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  originalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  discountedPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true
  },
  badgeText: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Oferta do Dia'
  },
  highlightColor: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '#ef4444'
  }
}, {
  timestamps: true,
  tableName: 'daily_deals'
});

DailyDeal.associate = (models) => {
  DailyDeal.belongsTo(models.ServiceType, {
    foreignKey: 'serviceTypeId',
    as: 'serviceType'
  });
  DailyDeal.belongsTo(models.Part, {
    foreignKey: 'partId',
    as: 'part'
  });
};

module.exports = DailyDeal;
