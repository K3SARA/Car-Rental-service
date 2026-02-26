export default async function (client) {
  await client.query(`
    CREATE TABLE vehicles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      registration_number VARCHAR(50) UNIQUE NOT NULL,
      vehicle_type VARCHAR(50) NOT NULL DEFAULT 'car' CHECK (vehicle_type IN ('car', 'van', 'bike', 'tuk_tuk')),
      model VARCHAR(255),
      brand VARCHAR(255),
      year INTEGER,
      fuel_type VARCHAR(50),
      transmission VARCHAR(50),
      mileage INTEGER DEFAULT 0,
      insurance_expiry DATE,
      license_expiry DATE,
      status VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance')),
      daily_rate DECIMAL(12,2) DEFAULT 0,
      hourly_rate DECIMAL(12,2) DEFAULT 0,
      distance_rate_per_km DECIMAL(12,2) DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}
