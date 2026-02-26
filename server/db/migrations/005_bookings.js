export default async function (client) {
  await client.query(`
    CREATE TABLE bookings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      vehicle_id UUID NOT NULL REFERENCES vehicles(id),
      customer_id UUID NOT NULL REFERENCES customers(id),
      created_by UUID REFERENCES users(id),
      start_date DATE NOT NULL,
      start_time TIME NOT NULL,
      return_date DATE NOT NULL,
      return_time TIME NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'active', 'completed', 'cancelled')),
      total_amount DECIMAL(12,2),
      paid_amount DECIMAL(12,2) DEFAULT 0,
      payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid')),
      payment_method VARCHAR(50) CHECK (payment_method IN ('cash', 'card', 'bank_transfer')),
      mileage_before INTEGER,
      mileage_after INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}
