#!/usr/bin/env node
/**
 * Database migration script
 * Runs all SQL migrations in order
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

async function migrate() {
  const dbUrl = process.env.DATABASE_URL;
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Enable SSL for external databases (Render, CockroachDB, any production non-localhost)
  const needsSsl = dbUrl && (
    dbUrl.includes('cockroachlabs.cloud') ||
    dbUrl.includes('render.com') ||
    dbUrl.includes('onrender.com') ||
    (isProduction && !dbUrl.includes('localhost'))
  );

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  });

  try {
    console.log('Running migrations...');

    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      console.log(`  Running: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      // Remove comments and split by semicolons
      const cleaned = sql
        .replace(/--.*$/gm, '')  // Remove single-line comments
        .replace(/\/\*[\s\S]*?\*\//g, '');  // Remove multi-line comments

      // Split on semicolons, keeping track of statement boundaries
      const statements = [];
      let current = '';
      let parenDepth = 0;

      for (const char of cleaned) {
        if (char === '(') parenDepth++;
        if (char === ')') parenDepth--;
        if (char === ';' && parenDepth === 0) {
          const stmt = current.trim();
          if (stmt) statements.push(stmt);
          current = '';
        } else {
          current += char;
        }
      }
      if (current.trim()) statements.push(current.trim());

      let count = 0;
      for (const statement of statements) {
        // Skip empty or whitespace-only statements
        if (!statement || statement.match(/^\s*$/)) continue;

        try {
          await pool.query(statement);
          count++;
        } catch (err) {
          // Ignore "already exists" errors for idempotency
          if (err.message.includes('already exists') ||
              err.message.includes('duplicate key')) {
            continue;
          }
          console.error(`    Error: ${err.message}`);
          console.error(`    Statement: ${statement.substring(0, 80)}...`);
          throw err;
        }
      }
      console.log(`  Done: ${count} statements executed`);
    }

    console.log('All migrations completed!');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  migrate();
}

module.exports = { migrate };
