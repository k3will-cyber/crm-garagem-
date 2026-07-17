const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const sequelize = require('./config/database');
const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const serviceOrderRoutes = require('./routes/serviceOrders');
const serviceTypeRoutes = require('./routes/serviceTypes');
const partsRoutes = require('./routes/parts');
const leadsRoutes = require('./routes/leads');
const usersRoutes = require('./routes/users');
const partRequestsRoutes = require('./routes/partRequests');
const meecStockRoutes = require('./routes/meecStock');
const vehicleRoutes = require('./routes/vehicles');
const { authenticateToken } = require('./middleware/auth');
const { initSocket } = require('./socket');
const { initNotificationService } = require('./services/notificationService');
const publicRoutes = require('./routes/public');
const setupRoutes = require('./routes/setup');
const bcrypt = require('bcryptjs');
const db = require('./models');

require('dotenv').config();

// Fallback ACCESS_TOKEN_SECRET if not set in environment
if (!process.env.ACCESS_TOKEN_SECRET) {
  process.env.ACCESS_TOKEN_SECRET = 'crm-garagem-fallback-secret-' + require('crypto').randomBytes(16).toString('hex');
  console.log('[Server] ACCESS_TOKEN_SECRET not set, using generated fallback');
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// ─── Health Check ───────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Database connection (sync below handles authentication automatically)

// Public routes (no auth required)
app.use('/api/public', publicRoutes);
app.use('/api/setup', setupRoutes);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', authenticateToken, clientRoutes);
app.use('/api/service-orders', authenticateToken, serviceOrderRoutes);
app.use('/api/service-types', authenticateToken, serviceTypeRoutes);
app.use('/api/parts', authenticateToken, partsRoutes);
app.use('/api/leads', authenticateToken, leadsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/part-requests', authenticateToken, partRequestsRoutes);
app.use('/api/meec-stock', authenticateToken, meecStockRoutes);
app.use('/api/vehicles', authenticateToken, vehicleRoutes);
// Wildcard handler to serve React SPA
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Start HTTP server first (healthcheck needs port open)
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Initialize Socket.IO with the HTTP server
  initSocket(server);

  // Initialize notification service
  initNotificationService();

  // Sync database and seed admin user
  syncAndSeed().catch(err => console.log('[DB] Sync error:', err.message));
});

/**
 * Sync database and seed admin user with retry logic
 */
async function syncAndSeed() {
  try {
    await sequelize.sync();
    console.log('Database synced');
    await seedAdminUser();
    console.log('[Startup] CRM ready — admin exists, login enabled');
  } catch (err) {
    console.log('Database sync error: ' + err.message);
    // Retry sync after 5 seconds (PostgreSQL might not be ready yet)
    setTimeout(() => {
      syncAndSeed().catch(e => console.log('[DB] Retry sync error:', e.message));
    }, 5000);
  }
}

/**
 * Auto-seed admin user if no users exist in the database
 */
async function seedAdminUser() {
  try {
    const userCount = await db.User.count();
    if (userCount === 0) {
      console.log('No users found. Creating default admin user...');
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
      console.log('Admin user created: admin@crmgaragem.com / admin123');
    }
  } catch (err) {
    console.error('Auto-seed error:', err.message);
    // Retry seed after 3 seconds (might be a race condition)
    setTimeout(() => seedAdminUser().catch(e => console.log('[Seed] Retry error:', e.message)), 3000);
  }
}