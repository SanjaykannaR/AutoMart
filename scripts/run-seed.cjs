#!/usr/bin/env node
// ================================================================
// AutoMart — SQL Seed Runner
// Executes supabase/seed.sql against Supabase PostgreSQL
// Run: node scripts/run-seed.js
// ================================================================

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

const DATABASE_URL = process.env.DATABASE_URL ||
  'postgresql://postgres.mmvrkljevwgkonpljsut:JGQQ3%2FdEuaaLs3P@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true'

const SQL_FILE = path.join(__dirname, '..', 'supabase', 'seed.sql')

async function main() {
  console.log('\n🌱 Running SQL seed against Supabase...\n')

  const sql = fs.readFileSync(SQL_FILE, 'utf-8')

  // Split by semicolons but handle $$ delimiters (PL/pgSQL)
  const statements = []
  let current = ''
  let inDollarQuote = false

  for (const line of sql.split('\n')) {
    // Skip comments
    if (line.trim().startsWith('--')) continue

    if (line.includes('$$')) {
      inDollarQuote = !inDollarQuote
    }

    current += line + '\n'

    if (!inDollarQuote && line.trim().endsWith(';')) {
      const trimmed = current.trim()
      if (trimmed.length > 0) {
        statements.push(trimmed)
      }
      current = ''
    }
  }

  console.log(`  Found ${statements.length} SQL statements\n`)

  const client = new Client({ connectionString: DATABASE_URL })

  try {
    await client.connect()
    console.log('  ✅ Connected to Supabase PostgreSQL\n')

    let success = 0
    let skipped = 0
    let errors = 0

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i]
      const preview = stmt.substring(0, 80).replace(/\n/g, ' ')

      try {
        await client.query(stmt)
        success++
        console.log(`  [${i + 1}/${statements.length}] ✅ ${preview}...`)
      } catch (err) {
        if (err.code === '23505') {
          // Unique constraint violation — data already exists
          skipped++
          console.log(`  [${i + 1}/${statements.length}] ⏭  ${preview}... (already exists)`)
        } else {
          errors++
          console.log(`  [${i + 1}/${statements.length}] ❌ ${preview}...`)
          console.log(`         Error: ${err.message}`)
        }
      }
    }

    console.log(`\n  Results: ${success} ✅ | ${skipped} ⏭  | ${errors} ❌`)
  } catch (err) {
    console.error(`\n  ❌ Connection failed: ${err.message}`)
    console.log('  Check DATABASE_URL and ensure Supabase is accessible.')
  } finally {
    await client.end()
  }

  console.log('\n🌱 Seed complete.\n')
}

main()
