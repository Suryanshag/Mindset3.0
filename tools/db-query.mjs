#!/usr/bin/env node
// Lightweight ad-hoc SQL runner using pg + Prisma's adapter pattern.
// Usage: node tools/db-query.mjs "<sql>"
import pg from 'pg'

const sql = process.argv[2]
if (!sql) {
  console.error('Usage: node tools/db-query.mjs "<sql>"')
  process.exit(2)
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
try {
  const res = await pool.query(sql)
  console.log(JSON.stringify(res.rows, null, 2))
} catch (err) {
  console.error('SQL error:', err.message)
  process.exit(1)
} finally {
  await pool.end()
}
