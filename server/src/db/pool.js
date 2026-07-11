/**
 * PostgreSQL connection pool for Neon.
 * Uses DATABASE_URL from environment with SSL enabled (required by Neon).
 */

import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    // Neon requires SSL — reject unauthorized certs in production
    rejectUnauthorized: process.env.NODE_ENV === 'production',
  },
  // Connection pool sizing for serverless-friendly usage
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

// Log unexpected pool errors so they don't crash the process
pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message);
});

export default pool;
