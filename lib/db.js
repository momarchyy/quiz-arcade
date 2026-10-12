import mysql from 'mysql2/promise';

const g = globalThis;

export const pool =
  g._quizPool ??
  (g._quizPool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'false' ? undefined : { rejectUnauthorized: false },
    connectionLimit: 2,        // the free DB allows few connections
    waitForConnections: true,
    queueLimit: 0,
  }));
