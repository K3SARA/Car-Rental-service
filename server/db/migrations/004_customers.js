export default async function (client) {
  await client.query(`
    CREATE TABLE customers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      nic_or_passport VARCHAR(100),
      address TEXT,
      driving_license_photo_path VARCHAR(500),
      is_flagged BOOLEAN DEFAULT FALSE,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}
