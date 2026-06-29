'use strict';

const { Pool } = require('pg');

/**
 * Create and return the PostgreSQL connection pool.
 */
function createPool({ dbHost, dbPort, dbName, dbUser, dbPassword }) {
  const pool = new Pool({
    host: dbHost,
    port: dbPort,
    database: dbName,
    user: dbUser,
    password: dbPassword,
    max: 10,
  });

  pool.on('error', (err) => {
    console.error('PostgreSQL pool error:', err);
  });

  return pool;
}

module.exports = { createPool };
