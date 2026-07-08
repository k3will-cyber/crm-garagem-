const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Role-based authorization middleware
// Usage: authorize('admin', 'manager') or authorize('admin')
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.user) {
      return res.status(401).json({ msg: 'Not authenticated' });
    }
    if (!roles.includes(req.user.user.role)) {
      return res.status(403).json({ msg: 'Forbidden: insufficient permissions' });
    }
    next();
  };
};

module.exports = { authenticateToken, authorize };
