import pool from '../config/db.js';

export async function list(req, res) {
  try {
    const { status, vehicle_type } = req.query;
    let q = 'SELECT v.*, (SELECT json_agg(p ORDER BY p.sort_order) FROM vehicle_photos p WHERE p.vehicle_id = v.id) AS photos FROM vehicles v WHERE 1=1';
    const params = [];
    let i = 1;
    if (status) { params.push(status); q += ` AND v.status = $${i++}`; }
    if (vehicle_type) { params.push(vehicle_type); q += ` AND v.vehicle_type = $${i++}`; }
    q += ' ORDER BY v.registration_number';
    const { rows } = await pool.query(q, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function get(req, res) {
  try {
    const { rows } = await pool.query(
      'SELECT v.*, (SELECT json_agg(p ORDER BY p.sort_order) FROM vehicle_photos p WHERE p.vehicle_id = v.id) AS photos FROM vehicles v WHERE v.id = $1',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function create(req, res) {
  const b = req.body;
  const reg = b.registration_number;
  if (!reg) return res.status(400).json({ error: 'registration_number required' });
  const year = b.year ? parseInt(b.year, 10) : null;
  const mileage = b.mileage ? parseInt(b.mileage, 10) : 0;
  const dailyRate = b.daily_rate != null ? parseFloat(b.daily_rate) : 0;
  const hourlyRate = b.hourly_rate != null ? parseFloat(b.hourly_rate) : 0;
  const distanceRate = b.distance_rate_per_km != null ? parseFloat(b.distance_rate_per_km) : 0;
  if (Number.isNaN(mileage) || mileage < 0) return res.status(400).json({ error: 'Mileage cannot be negative' });
  if (Number.isNaN(dailyRate) || dailyRate < 0 || Number.isNaN(hourlyRate) || hourlyRate < 0 || Number.isNaN(distanceRate) || distanceRate < 0) {
    return res.status(400).json({ error: 'Rates cannot be negative' });
  }
  if (year != null) {
    const currentYear = new Date().getFullYear();
    if (Number.isNaN(year) || year < 1980 || year > currentYear + 1) {
      return res.status(400).json({ error: `Year must be between 1980 and ${currentYear + 1}` });
    }
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO vehicles (registration_number, vehicle_type, model, brand, year, fuel_type, transmission,
        mileage, insurance_expiry, license_expiry, status, daily_rate, hourly_rate, distance_rate_per_km)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        reg, b.vehicle_type || 'car', b.model, b.brand, year,
        b.fuel_type, b.transmission, mileage,
        b.insurance_expiry || null, b.license_expiry || null, b.status || 'available',
        dailyRate, hourlyRate, distanceRate,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Registration number already exists' });
    res.status(500).json({ error: err.message });
  }
}

export async function update(req, res) {
  const b = req.body;
  if (b.year !== undefined) {
    const year = parseInt(b.year, 10);
    const currentYear = new Date().getFullYear();
    if (Number.isNaN(year) || year < 1980 || year > currentYear + 1) {
      return res.status(400).json({ error: `Year must be between 1980 and ${currentYear + 1}` });
    }
  }
  if (b.mileage !== undefined) {
    const mileage = parseInt(b.mileage, 10);
    if (Number.isNaN(mileage) || mileage < 0) return res.status(400).json({ error: 'Mileage cannot be negative' });
  }
  if (b.daily_rate !== undefined || b.hourly_rate !== undefined || b.distance_rate_per_km !== undefined) {
    const dailyRate = b.daily_rate !== undefined ? parseFloat(b.daily_rate) : 0;
    const hourlyRate = b.hourly_rate !== undefined ? parseFloat(b.hourly_rate) : 0;
    const distanceRate = b.distance_rate_per_km !== undefined ? parseFloat(b.distance_rate_per_km) : 0;
    if ((b.daily_rate !== undefined && (Number.isNaN(dailyRate) || dailyRate < 0))
      || (b.hourly_rate !== undefined && (Number.isNaN(hourlyRate) || hourlyRate < 0))
      || (b.distance_rate_per_km !== undefined && (Number.isNaN(distanceRate) || distanceRate < 0))) {
      return res.status(400).json({ error: 'Rates cannot be negative' });
    }
  }
  const fields = [];
  const values = [];
  let i = 1;
  const set = (col, val) => { if (val !== undefined) { fields.push(col + ' = $' + i++); values.push(val); } };
  set('registration_number', b.registration_number);
  set('vehicle_type', b.vehicle_type);
  set('model', b.model);
  set('brand', b.brand);
  if (b.year !== undefined) { fields.push('year = $' + i++); values.push(parseInt(b.year, 10)); }
  set('fuel_type', b.fuel_type);
  set('transmission', b.transmission);
  if (b.mileage !== undefined) { fields.push('mileage = $' + i++); values.push(parseInt(b.mileage, 10)); }
  set('insurance_expiry', b.insurance_expiry);
  set('license_expiry', b.license_expiry);
  set('status', b.status);
  if (b.daily_rate !== undefined) { fields.push('daily_rate = $' + i++); values.push(parseFloat(b.daily_rate)); }
  if (b.hourly_rate !== undefined) { fields.push('hourly_rate = $' + i++); values.push(parseFloat(b.hourly_rate)); }
  if (b.distance_rate_per_km !== undefined) { fields.push('distance_rate_per_km = $' + i++); values.push(parseFloat(b.distance_rate_per_km)); }
  if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
  fields.push('updated_at = NOW()');
  values.push(req.params.id);
  try {
    const { rows } = await pool.query(
      'UPDATE vehicles SET ' + fields.join(', ') + ' WHERE id = $' + i + ' RETURNING *',
      values
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Registration number already exists' });
    res.status(500).json({ error: err.message });
  }
}

export async function remove(req, res) {
  try {
    const { rowCount } = await pool.query('DELETE FROM vehicles WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Vehicle not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
