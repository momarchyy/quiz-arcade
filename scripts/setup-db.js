const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: process.env.DB_SSL === 'false' ? undefined : { rejectUnauthorized: false },
      multipleStatements: true,
    });

    const schemaSql = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
    await connection.query(schemaSql);
    console.log('Schema applied successfully.');

    const [rows] = await connection.query('SELECT COUNT(*) AS c FROM quizzes');
    const count = rows[0].c;

    if (Number(count) === 0) {
      const seedSql = fs.readFileSync(path.join(__dirname, '..', 'db', 'seed.sql'), 'utf8');
      await connection.query(seedSql);
      console.log('Database seeded with initial data.');
    } else {
      console.log('Quizzes table already populated; skipping seed.');
    }

    console.log('Database setup complete!');
    await connection.end();
  } catch (err) {
    console.error('Database setup failed:', err.message);
    if (connection) {
      await connection.end().catch(() => {});
    }
    process.exit(1);
  }
}

main();
