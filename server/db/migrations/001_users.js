export default async function (client) {
  await client.query(`
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'staff', 'driver')),
      name VARCHAR(255),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}
