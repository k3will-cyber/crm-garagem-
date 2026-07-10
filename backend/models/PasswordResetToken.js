const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const crypto = require('crypto');

const PasswordResetToken = sequelize.define('PasswordResetToken', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'crm_users',
      key: 'id'
    }
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  used: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true
});

PasswordResetToken.associate = (models) => {
  PasswordResetToken.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
};

// Generate a cryptographically secure random token
PasswordResetToken.generateToken = function () {
  return crypto.randomBytes(32).toString('hex');
};

// Check if token has expired
PasswordResetToken.prototype.isExpired = function () {
  return new Date() > new Date(this.expiresAt);
};

module.exports = PasswordResetToken;
