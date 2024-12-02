// pool.js - Database connection pool
const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'Kur0sawa',
    port: 5432,
});

module.exports = pool;
