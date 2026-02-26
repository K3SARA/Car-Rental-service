import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

export async function register(req, res) {
  const { email, password, role = 'staff', name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (email, password_hash, role, name) VALUES ($1, $2, $3, $4) RETURNING id, email, role, name',
      [email, hash, role, name || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email already registered' });
    res.status(500).json({ error: err.message });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const { rows } = await pool.query('SELECT id, email, password_hash, role, name FROM users WHERE email = $1', [email]);
  if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
  const match = await bcrypt.compare(password, rows[0].password_hash);
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign(
    { userId: rows[0].id },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );
  res.json({
    token,
    user: { id: rows[0].id, email: rows[0].email, role: rows[0].role, name: rows[0].name },
  });
}
