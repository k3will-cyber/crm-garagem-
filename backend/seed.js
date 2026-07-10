const db = require('./models');
const bcrypt = require('bcryptjs');
const partsData = require('./seed-data/parts');

async function seed() {
  try {
    // Sync database (alter tables to add missing columns)
    await db.sequelize.sync({ alter: true });
    console.log('✅ Database synced successfully');

    // ==========================================
    // USERS
    // ==========================================
    const userCount = await db.User.count();
    
    if (userCount === 0) {
      console.log('📝 No users found. Creating default admin user...');
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      const admin = await db.User.create({
        name: 'Admin',
        email: 'admin@crmgaragem.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        phone: '(11) 99999-9999'
      });

      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('  ✅ ADMIN USER CREATED!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`  Email:    admin@crmgaragem.com`);
      console.log(`  Password: admin123`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      console.log('⚠️  CHANGE THE PASSWORD AFTER FIRST LOGIN!');
    } else {
      console.log(`👥 ${userCount} user(s) already exist. Skipping user seed.`);
    }

    // ==========================================
    // PARTS (INVENTÁRIO)
    // ==========================================
    const existingParts = await db.Part.count();

    if (existingParts === 0) {
      console.log('📦 No parts found. Creating initial inventory...');
      console.log(`   ${partsData.length} products to import...`);

      // Insert in batches of 10 for better performance
      const batchSize = 10;
      let imported = 0;

      for (let i = 0; i < partsData.length; i += batchSize) {
        const batch = partsData.slice(i, i + batchSize);
        await db.Part.bulkCreate(batch, { ignoreDuplicates: true });
        imported += batch.length;
        process.stdout.write(`\r   📥 Imported ${imported}/${partsData.length} products...`);
      }

      console.log('');
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`  ✅ ${imported} PRODUCTS IMPORTED!`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');

      // Show summary by category
      const categories = {};
      partsData.forEach(p => {
        const cat = p.sku.split('-')[0];
        categories[cat] = (categories[cat] || 0) + 1;
      });

      const categoryLabels = {
        OLE: 'Óleos e Lubrificantes',
        FIL: 'Filtros',
        FRE: 'Freios',
        IGN: 'Ignição',
        ILU: 'Iluminação',
        COR: 'Correias',
        BAT: 'Baterias',
        SUS: 'Suspensão',
        REF: 'Arrefecimento',
        DIV: 'Diversos'
      };

      console.log('📊 Inventory Summary:');
      Object.entries(categories).forEach(([cat, count]) => {
        const label = categoryLabels[cat] || cat;
        console.log(`   • ${label}: ${count} products`);
      });
      console.log('');
      console.log('💡 Tip: Edit product descriptions via the admin panel.');
    } else {
      console.log(`📦 ${existingParts} product(s) already exist. Skipping parts seed.`);
      console.log('   To re-seed, delete the database file and run seed again.');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  ✅ SEED COMPLETED SUCCESSFULLY!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

seed();
