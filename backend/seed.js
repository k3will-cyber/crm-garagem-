const db = require('./models');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    // Sync database (alter tables to add missing columns)
    await db.sequelize.sync({ alter: true });
    console.log('✅ Database synced successfully');

    // Check if any users exist
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
      console.log(`👥 ${userCount} user(s) already exist. Skipping seed.`);
      console.log('');
      console.log('Use existing credentials or create new users via the app.');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
