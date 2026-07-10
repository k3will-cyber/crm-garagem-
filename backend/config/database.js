const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

let sequelize;

if (process.env.DATABASE_URL) {
  // Production: PostgreSQL via DATABASE_URL (Railway, Render, Supabase, etc.)
  const pgConfig = {
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  };

  // Try without SSL first (for Railway internal Docker PG)
  // If PGSSLMODE=require is set, use SSL
  if (process.env.PGSSLMODE === 'require') {
    pgConfig.dialectOptions = {
      ssl: { require: true, rejectUnauthorized: false }
    };
  }

  sequelize = new Sequelize(process.env.DATABASE_URL, pgConfig);
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
