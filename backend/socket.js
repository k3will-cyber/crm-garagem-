const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

require('dotenv').config();
const JWT_SECRET = process.env.ACCESS_TOKEN_SECRET || 'crm_garagem_secret_key_2024';

let io = null;

// User rooms
const ROOMS = {
  MANAGERS: 'managers', // admin + manager
  ALL: 'all'
};

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user?.user || socket.user;
    console.log(`[Socket] User connected: ${user?.name || 'Unknown'} (${user?.role || '?'})`);

    // Join rooms based on role
    socket.join(ROOMS.ALL);
    if (user?.role === 'admin' || user?.role === 'manager') {
      socket.join(ROOMS.MANAGERS);
    }

    // Join personal room for direct notifications
    if (user?.id) {
      socket.join(`user:${user.id}`);
    }

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${user?.name || 'Unknown'}`);
    });
  });

  console.log('[Socket] Socket.IO initialized');
  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}

function emitToManagers(event, data) {
  if (io) {
    io.to(ROOMS.MANAGERS).emit(event, data);
  }
}

function emitToUser(userId, event, data) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

function emitToAll(event, data) {
  if (io) {
    io.emit(event, data);
  }
}

module.exports = { initSocket, getIO, emitToManagers, emitToUser, emitToAll };
