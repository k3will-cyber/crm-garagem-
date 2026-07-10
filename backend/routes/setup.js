const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const db = require('../models');
const partsData = require('../seed-data/parts');
const meecProductsData = require('../seed-data/meecProducts');

/**
 * POST /api/setup
 * Forces database sync, creates admin user, and seeds inventory.
 * This is called manually after deploy to initialize the database.
 */
router.post('/', async (req, res) => {
  const startTime = Date.now();
  const result = { synced: false, adminCreated: false, partsImported: 0, error: null, time: 0 };

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

    // Step 3: Seed inventory parts
    const existingParts = await db.Part.count();
    if (existingParts === 0) {
      console.log(`[Setup] Seeding ${partsData.length} inventory parts...`);

      const batchSize = 10;
      let imported = 0;

      for (let i = 0; i < partsData.length; i += batchSize) {
        const batch = partsData.slice(i, i + batchSize);
        await db.Part.bulkCreate(batch, { ignoreDuplicates: true });
        imported += batch.length;
      }

      result.partsImported = imported;
      console.log(`[Setup] ${imported} parts imported successfully`);
    } else {
      console.log(`[Setup] ${existingParts} parts already exist, skipping import`);
    }

    // Step 4: Seed MEEC stock products
    const existingMeec = await db.MeecProduct.count();
    if (existingMeec === 0) {
      console.log(`[Setup] Seeding ${meecProductsData.length} MEEC stock products...`);

      const batchSize = 10;
      let meecImported = 0;

      for (let i = 0; i < meecProductsData.length; i += batchSize) {
        const batch = meecProductsData.slice(i, i + batchSize);
        await db.MeecProduct.bulkCreate(batch, { ignoreDuplicates: true });
        meecImported += batch.length;
      }

      result.meecImported = meecImported;
      console.log(`[Setup] ${meecImported} MEEC products imported successfully`);
    } else {
      console.log(`[Setup] ${existingMeec} MEEC products already exist, skipping import`);
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
