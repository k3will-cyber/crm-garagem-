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
const { authenticateToken } = require('./middleware/auth');
const { initSocket } = require('./socket');
const { initNotificationService } = require('./services/notificationService');
const publicRoutes = require('./routes/public');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Database connection
sequelize.authenticate()
  .then(() => console.log('Database connected...'))
  .catch(err => console.log('Error: ' + err));

// Public routes (no auth required)
app.use('/api/public', publicRoutes);

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

// Wildcard handler to serve React SPA
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Sync database and start server
sequelize.sync()
  .then(() => {
    const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    // Initialize Socket.IO with the HTTP server
    initSocket(server);
    // Initialize notification service
    initNotificationService();
  })
  .catch(err => console.log('Error: ' + err));