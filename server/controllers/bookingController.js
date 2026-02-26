import pool from '../config/db.js';

export async function list(req, res) {
  try {
    const { vehicle_id, customer_id, date_from, date_to, status } = req.query;
    let q = `SELECT b.*, v.registration_number, v.model, v.brand, c.name AS customer_name, c.phone AS customer_phone
             FROM bookings b JOIN vehicles v ON b.vehicle_id = v.id JOIN customers c ON b.customer_id = c.id WHERE 1=1`;
    const params = [];
    let i = 1;
    if (vehicle_id) { params.push(vehicle_id); q += ` AND b.vehicle_id = $${i++}`; }
    if (customer_id) { params.push(customer_id); q += ` AND b.customer_id = $${i++}`; }
    if (date_from) { params.push(date_from); q += ` AND b.return_date >= $${i++}`; }
    if (date_to) { params.push(date_to); q += ` AND b.start_date <= $${i++}`; }
    if (status) { params.push(status); q += ` AND b.status = $${i++}`; }
    q += ' ORDER BY b.start_date, b.start_time';
    const { rows } = await pool.query(q, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function get(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT b.*, v.registration_number, v.model, v.brand, v.daily_rate, v.hourly_rate, v.distance_rate_per_km,
              c.name AS customer_name, c.phone AS customer_phone, c.address AS customer_address, c.nic_or_passport
       FROM bookings b JOIN vehicles v ON b.vehicle_id = v.id JOIN customers c ON b.customer_id = c.id
       WHERE b.id = $1`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function create(req, res) {
  const { vehicle_id, customer_id, start_date, start_time, return_date, return_time } = req.body;
  if (!vehicle_id || !customer_id || !start_date || !start_time || !return_date || !return_time) {
    return res.status(400).json({ error: 'vehicle_id, customer_id, start_date, start_time, return_date, return_time required' });
  }
  const startDt = new Date(`${start_date}T${start_time}`);
  const returnDt = new Date(`${return_date}T${return_time}`);
   if (Number.isNaN(startDt.getTime()) || Number.isNaN(returnDt.getTime())) {
    return res.status(400).json({ error: 'Invalid start or return date/time' });
  }
  if (returnDt <= startDt) return res.status(400).json({ error: 'Return must be after start' });

  try {
    const conflict = await pool.query(
      `SELECT id FROM bookings WHERE vehicle_id = $1 AND status NOT IN ('cancelled')
       AND (return_date + return_time) > $2::timestamp AND (start_date + start_time) < $3::timestamp`,
      [vehicle_id, startDt.toISOString().slice(0, 19), returnDt.toISOString().slice(0, 19)]
    );
    if (conflict.rows.length > 0) {
      return res.status(409).json({ error: 'Vehicle already booked for this period' });
    }

    const { rows } = await pool.query(
      `INSERT INTO bookings (vehicle_id, customer_id, created_by, start_date, start_time, return_date, return_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [vehicle_id, customer_id, req.user?.id || null, start_date, start_time, return_date, return_time]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function update(req, res) {
  const {
    start_date, start_time, return_date, return_time, status,
    total_amount, paid_amount, payment_status, payment_method, mileage_before, mileage_after,
  } = req.body;
  const fields = [];
  const values = [];
  let i = 1;
  const set = (col, val) => { if (val !== undefined) { fields.push(`${col} = $${i++}`); values.push(val); } };
  set('start_date', start_date);
  set('start_time', start_time);
  set('return_date', return_date);
  set('return_time', return_time);
  set('status', status);
  set('total_amount', total_amount != null ? parseFloat(total_amount) : undefined);
  set('paid_amount', paid_amount != null ? parseFloat(paid_amount) : undefined);
  set('payment_status', payment_status);
  set('payment_method', payment_method);
  set('mileage_before', mileage_before != null ? parseInt(mileage_before, 10) : undefined);
  set('mileage_after', mileage_after != null ? parseInt(mileage_after, 10) : undefined);
  if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
  fields.push('updated_at = NOW()');
  values.push(req.params.id);

  if (status === 'completed' && mileage_after != null) {
    const bk = await pool.query('SELECT vehicle_id FROM bookings WHERE id = $1', [req.params.id]);
    if (bk.rows.length) await pool.query('UPDATE vehicles SET mileage = $1, updated_at = NOW() WHERE id = $2', [mileage_after, bk.rows[0].vehicle_id]);
  }

  try {
    const { rows } = await pool.query(
      `UPDATE bookings SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function checkAvailability(req, res) {
  const { vehicle_id, start_date, start_time, return_date, return_time, exclude_booking_id } = req.query;
  if (!start_date || !start_time || !return_date || !return_time) {
    return res.status(400).json({ error: 'start_date, start_time, return_date, return_time required' });
  }
  const startDt = new Date(`${start_date}T${start_time}`);
  const returnDt = new Date(`${return_date}T${return_time}`);
  const startStr = startDt.toISOString().slice(0, 19);
  const returnStr = returnDt.toISOString().slice(0, 19);
  let q = `SELECT id, vehicle_id FROM bookings WHERE status NOT IN ('cancelled')
           AND (return_date + return_time) > $1::timestamp AND (start_date + start_time) < $2::timestamp`;
  const params = [startStr, returnStr];
  let i = 3;
  if (vehicle_id) { params.push(vehicle_id); q += ` AND vehicle_id = $${i++}`; }
  if (exclude_booking_id) { params.push(exclude_booking_id); q += ` AND id != $${i}`; }
  try {
    const { rows } = await pool.query(q, params);
    const available = vehicle_id ? rows.length === 0 : null;
    const conflicting = rows;
    const busyVehicleIds = [...new Set(rows.map((r) => r.vehicle_id))];
    if (!vehicle_id) {
      const all = await pool.query('SELECT id FROM vehicles WHERE status = $1', ['available']);
      const freeIds = all.rows.filter((v) => !busyVehicleIds.includes(v.id)).map((v) => v.id);
      return res.json({ free_vehicle_ids: freeIds, conflicting, busy_vehicle_ids: busyVehicleIds });
    }
    res.json({ available: rows.length === 0, conflicting });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
