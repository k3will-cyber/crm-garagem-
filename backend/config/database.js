const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

let sequelize;

if (process.env.DATABASE_URL) {
  // Production: PostgreSQL via DATABASE_URL (Railway, Render, Supabase, etc.)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
} else {
  // Development: SQLite
  const MEEC_DB_PATH = process.env.MEEC_DB_PATH || path.resolve(__dirname, '../../../garagem-do-mec-site/data/garagem.db');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.NODE_ENV === 'test' ? ':memory:' : MEEC_DB_PATH,
    logging: false,
  });
}

module.exports = sequelize;
