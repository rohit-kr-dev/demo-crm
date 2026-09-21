require('dotenv').config();
const jwt = require('jsonwebtoken');

const JWT_SECRET = require('../config/auth-secret');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && (authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader);

  // EventSource cannot send headers — allow token via query for SSE streams
  if (!token && req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Session expired. Please sign in again.' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = { authenticateToken, requireRole };
