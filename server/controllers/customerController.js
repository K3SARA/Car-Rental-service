import pool from '../config/db.js';

export async function list(req, res) {
  try {
    const { search } = req.query;
    let q = 'SELECT * FROM customers WHERE 1=1';
    const params = [];
    if (search) {
      params.push('%' + search + '%');
      q += ' AND (name ILIKE $1 OR phone ILIKE $1 OR nic_or_passport ILIKE $1)';
    }
    q += ' ORDER BY name';
    const { rows } = await pool.query(q, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function get(req, res) {
  try {
    const { rows } = await pool.query('SELECT * FROM customers WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function create(req, res) {
  const { name, phone, nic_or_passport, address, driving_license_photo_path, is_flagged, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO customers (name, phone, nic_or_passport, address, driving_license_photo_path, is_flagged, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, phone || null, nic_or_passport || null, address || null, driving_license_photo_path || null, !!is_flagged, notes || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function update(req, res) {
  const b = req.body;
  const fields = [];
  const values = [];
  let i = 1;
  const set = (col, val) => { if (val !== undefined) { fields.push(col + ' = $' + i++); values.push(val); } };
  set('name', b.name);
  set('phone', b.phone);
  set('nic_or_passport', b.nic_or_passport);
  set('address', b.address);
  set('driving_license_photo_path', b.driving_license_photo_path);
  set('is_flagged', b.is_flagged);
  set('notes', b.notes);
  if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
  fields.push('updated_at = NOW()');
  values.push(req.params.id);
  try {
    const { rows } = await pool.query(
      'UPDATE customers SET ' + fields.join(', ') + ' WHERE id = $' + i + ' RETURNING *',
      values
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function remove(req, res) {
  try {
    const { rowCount } = await pool.query('DELETE FROM customers WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Customer not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
