const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PartRequest = sequelize.define('PartRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  partId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  requestedBy: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  serviceOrderId: {
    type: DataTypes.INTEGER
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'fulfilled'),
    defaultValue: 'pending'
  },
  approvedBy: {
    type: DataTypes.INTEGER
  },
  notes: {
    type: DataTypes.TEXT
  },
  rejectionReason: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: true
});

PartRequest.associate = (models) => {
  PartRequest.belongsTo(models.Part, {
    foreignKey: 'partId',
    as: 'part'
  });
  PartRequest.belongsTo(models.User, {
    foreignKey: 'requestedBy',
    as: 'requester'
  });
  PartRequest.belongsTo(models.User, {
    foreignKey: 'approvedBy',
    as: 'approver'
  });
  PartRequest.belongsTo(models.ServiceOrder, {
    foreignKey: 'serviceOrderId',
    as: 'serviceOrder'
  });
};

module.exports = PartRequest;
