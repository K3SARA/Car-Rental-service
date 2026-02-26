import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

async function seed() {
  // Admin user
  const hash = await bcrypt.hash('admin123', 10);
  await pool.query(
    `INSERT INTO users (email, password_hash, role, name)
     VALUES ('admin@rental.com', $1, 'admin', 'Admin')
     ON CONFLICT (email) DO NOTHING`,
    [hash],
  );
  console.log('Seed: admin user created (admin@rental.com / admin123)');

  // Sample vehicles
  const vehicles = [
    // reg,      type,   model,        brand,    year, fuel,    transmission, mileage, insurance_expiry, license_expiry, status,      daily, hourly, dist/km
    ['CAR-001', 'car',  'Corolla',     'Toyota', 2018, 'Petrol', 'Automatic', 45000,   '2027-12-31',     '2027-06-30',   'available', 8000,  40,     20],
    ['CAR-002', 'car',  'Axio',        'Toyota', 2020, 'Hybrid', 'Automatic', 32000,   '2027-10-31',     '2027-05-31',   'available', 9000,  45,     25],
    ['VAN-001', 'van',  'KDH',         'Toyota', 2017, 'Diesel', 'Manual',    98000,   '2027-08-31',     '2027-04-30',   'available', 12000, 60,     35],
    ['BIKE-001','bike', 'FZ',          'Yamaha', 2019, 'Petrol', 'Manual',    22000,   '2027-09-30',     '2027-03-31',   'available', 3000,  20,     10],
    ['TUK-001', 'tuk_tuk','Bajaj RE',  'Bajaj',  2016, 'Petrol', 'Manual',    65000,   '2027-11-30',     '2027-02-28',   'available', 2500,  18,     8],
  ];

  await pool.query(
    `INSERT INTO vehicles
      (registration_number, vehicle_type, model, brand, year, fuel_type, transmission,
       mileage, insurance_expiry, license_expiry, status, daily_rate, hourly_rate, distance_rate_per_km)
     VALUES
      ${vehicles
        .map(
          (_, i) =>
            `($${i * 14 + 1}, $${i * 14 + 2}, $${i * 14 + 3}, $${i * 14 + 4}, $${i * 14 + 5}, $${i * 14 + 6}, $${i * 14 + 7}, $${i * 14 + 8}, $${i * 14 + 9}, $${i * 14 + 10}, $${i * 14 + 11}, $${i * 14 + 12}, $${i * 14 + 13}, $${i * 14 + 14})`,
        )
        .join(', ')}
     ON CONFLICT (registration_number) DO NOTHING`,
    vehicles.flat(),
  );
  console.log(`Seed: ${vehicles.length} sample vehicles inserted (if not existing)`);

  // Sample customers
  const customers = [
    // name,                phone,        nic/passport, address,                          license_photo, is_flagged, notes
    ['John Perera',        '0711234567', '901234567V', 'Colombo 05',                      null,          false,     null],
    ['Amali Fernando',     '0779876543', '922345678V', 'Negombo',                         null,          false,     null],
    ['Ravi Kumar',         '0755555555', 'N1234567',   'Kandy',                           null,          true,      'Late payments previously'],
    ['Sarah Johnson',      '+94 71 2233445', 'P9876543','Galle',                         null,          false,     null],
    ['Tourist Group Lead', '+94 77 3344556', 'P1234567','Ella guest house, Ella',        null,          false,     'Often books vans for tours'],
  ];

  for (const c of customers) {
    // Avoid duplicates by name + phone without requiring a DB constraint
    await pool.query(
      `INSERT INTO customers
        (name, phone, nic_or_passport, address, driving_license_photo_path, is_flagged, notes)
       SELECT $1, $2, $3, $4, $5, $6, $7
       WHERE NOT EXISTS (
         SELECT 1 FROM customers WHERE name = $1 AND phone = $2
       )`,
      c,
    );
  }
  console.log(`Seed: sample customers inserted where missing`);

  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
