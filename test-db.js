const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000,
});

async function test() {
  console.log('Testing DB connection...');
  const start = Date.now();
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Success:', res.rows[0], 'in', Date.now() - start, 'ms');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

test();
