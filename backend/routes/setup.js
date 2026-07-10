const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const db = require('../models');

/**
 * POST /api/setup
 * Forces database sync and creates admin user if it doesn't exist.
 * This is called manually after deploy to initialize the database.
 */
router.post('/', async (req, res) => {
  const startTime = Date.now();
  const result = { synced: false, adminCreated: false, error: null, time: 0 };

  try {
    console.log('[Setup] Starting database sync...');

    // Step 1: Sync database (create all tables)
    await sequelize.sync({ force: false, alter: false });
    result.synced = true;
    console.log('[Setup] Database synced successfully');

    // Step 2: Check if admin user exists
    const userCount = await db.User.count();
    console.log(`[Setup] Existing users: ${userCount}`);

    if (userCount === 0) {
      // Step 3: Create admin user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      await db.User.create({
        name: 'Admin',
        email: 'admin@crmgaragem.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        phone: '(11) 99999-9999'
      });

      result.adminCreated = true;
      console.log('[Setup] Admin user created: admin@crmgaragem.com');
    } else {
      console.log('[Setup] Admin user already exists, skipping creation');
    }

    result.time = Date.now() - startTime;
    res.json({
      success: true,
      message: 'Database initialized successfully',
      data: {
        ...result,
        credentials: {
          email: 'admin@crmgaragem.com',
          password: 'admin123'
        }
      }
    });
  } catch (err) {
    result.error = err.message;
    result.time = Date.now() - startTime;
    console.error('[Setup] Error:', err.message);

    res.status(500).json({
      success: false,
      message: 'Setup failed',
      error: err.message
    });
  }
});

module.exports = router;
