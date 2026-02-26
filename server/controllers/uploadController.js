import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pool from '../config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = process.env.UPLOAD_PATH || path.join(__dirname, '../uploads');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export async function uploadVehiclePhoto(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const { vehicle_id, sort_order = 0 } = req.body;
  if (!vehicle_id) return res.status(400).json({ error: 'vehicle_id required' });
  ensureDir(uploadDir);
  const relPath = 'vehicle_' + Date.now() + '_' + req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fullPath = path.join(uploadDir, relPath);
  fs.renameSync(req.file.path, fullPath);
  try {
    const { rows } = await pool.query(
      'INSERT INTO vehicle_photos (vehicle_id, file_path, sort_order) VALUES ($1, $2, $3) RETURNING *',
      [vehicle_id, '/uploads/' + relPath, parseInt(sort_order, 10) || 0]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function uploadLicensePhoto(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const { customer_id } = req.body;
  if (!customer_id) return res.status(400).json({ error: 'customer_id required' });
  ensureDir(uploadDir);
  const relPath = 'license_' + Date.now() + '_' + req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fullPath = path.join(uploadDir, relPath);
  fs.renameSync(req.file.path, fullPath);
  const filePath = '/uploads/' + relPath;
  await pool.query('UPDATE customers SET driving_license_photo_path = $1, updated_at = NOW() WHERE id = $2', [filePath, customer_id]);
  res.json({ path: filePath });
}
