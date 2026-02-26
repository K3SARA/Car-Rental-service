import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

export async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const { rows } = await pool.query('SELECT id, email, role, name FROM users WHERE id = $1', [decoded.userId]);
    if (rows.length === 0) return res.status(401).json({ error: 'User not found' });
    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (allowedRoles.includes(req.user.role)) return next();
    return res.status(403).json({ error: 'Insufficient permissions' });
  };
}
