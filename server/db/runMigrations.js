import pool from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigrations() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        run_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    const files = fs.readdirSync(path.join(__dirname, 'migrations')).sort();
    for (const file of files) {
      if (!file.endsWith('.js')) continue;
      const name = file.replace('.js', '');
      const { rows } = await client.query('SELECT 1 FROM _migrations WHERE name = $1', [name]);
      if (rows.length > 0) continue;
      const mod = await import(`./migrations/${file}`);
      if (typeof mod.default === 'function') {
        await mod.default(client);
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [name]);
        console.log('Ran migration:', name);
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch((err) => {
  console.error(err);
  process.exit(1);
});
