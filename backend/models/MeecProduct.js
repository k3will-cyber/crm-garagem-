const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MeecProduct = sequelize.define('MeecProduct', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  descricao: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  preco: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  categoria: {
    type: DataTypes.STRING(50),
    defaultValue: 'geral'
  },
  quantidade: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  ativo: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  }
}, {
  tableName: 'meec_products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = MeecProduct;
