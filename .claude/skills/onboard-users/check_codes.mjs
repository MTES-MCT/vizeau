#!/usr/bin/env node
// Checks a users batch (for user:seed --file) against the local database.
// Usage: node --env-file=.env check_codes.mjs <batch.json> [--show <code>,...] [--verify]
//
// Prints: codes missing from territoires (with the users affected), inactive codes,
// emails that already exist (user:seed would skip them),
// and the territoire name of each code passed to --show, to review ambiguous codes.
// With --verify, after user:seed and user:assign-territoires: checks that every user of the
// batch exists and has one relation per known code and id, and prints the mismatches.

import { readFileSync } from 'node:fs'
import pg from 'pg'

const [batchPath, ...rest] = process.argv.slice(2)
if (!batchPath) {
  console.error('Usage: node --env-file=.env check_codes.mjs <batch.json> [--show <code>,...]')
  process.exit(1)
}
const showIndex = rest.indexOf('--show')
const toShow = showIndex === -1 ? [] : rest[showIndex + 1].split(',').map((c) => c.trim())
const verify = rest.includes('--verify')

const users = JSON.parse(readFileSync(batchPath, 'utf-8'))
const codes = [...new Set(users.flatMap((u) => u.territoireCodes ?? []))]

const client = new pg.Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
})
await client.connect()

const territoiresResult = await client.query(
  'SELECT code, name, is_active FROM territoires WHERE code = ANY($1)',
  [[...codes, ...toShow]]
)
const byCode = new Map(territoiresResult.rows.map((t) => [t.code, t]))
const usersResult = await client.query('SELECT email FROM users WHERE lower(email) = ANY($1)', [
  users.map((u) => u.email.toLowerCase()),
])

if (verify) {
  const ids = [...new Set(users.flatMap((u) => u.territoireIds ?? []))]
  const idsResult = await client.query('SELECT id FROM territoires WHERE id = ANY($1::uuid[])', [
    ids,
  ])
  const knownIds = new Set(idsResult.rows.map((t) => t.id))
  const relationsResult = await client.query(
    `SELECT lower(u.email) AS email, count(r.territoire_id)::int AS relations
     FROM users u LEFT JOIN territoire_user_relations r ON r.user_id = u.id
     WHERE lower(u.email) = ANY($1) GROUP BY lower(u.email)`,
    [users.map((u) => u.email.toLowerCase())]
  )
  await client.end()

  const relations = new Map(relationsResult.rows.map((r) => [r.email, r.relations]))
  const mismatches = users
    .map((u) => ({
      email: u.email,
      expected:
        u.territoireCodes.filter((c) => byCode.has(c)).length +
        (u.territoireIds ?? []).filter((id) => knownIds.has(id)).length,
      actual: relations.get(u.email.toLowerCase()) ?? '<no user>',
    }))
    .filter((u) => u.expected !== u.actual)
  const total = [...relations.values()].reduce((sum, n) => sum + n, 0)

  console.log(`Users in database: ${relations.size}/${users.length}, relations: ${total}`)
  console.log(`Mismatches (${mismatches.length})`)
  if (mismatches.length > 0) console.table(mismatches)
  process.exit(mismatches.length > 0 ? 1 : 0)
}
await client.end()

const missing = codes.filter((c) => !byCode.has(c))
const inactive = codes.filter((c) => byCode.has(c) && !byCode.get(c).is_active)

console.log(`Codes checked: ${codes.length}, found: ${codes.length - missing.length}`)
console.log(`\nMissing codes (${missing.length}): ${missing.join(', ')}`)
console.log(`Inactive codes (${inactive.length}): ${inactive.join(', ')}`)

const affected = users
  .map((u) => {
    const userMissing = u.territoireCodes.filter((c) => missing.includes(c) || inactive.includes(c))
    return {
      email: u.email,
      fullName: u.fullName,
      unusableCodes: userMissing.join(', '),
      usableCodes: u.territoireCodes.length - userMissing.length + (u.territoireIds?.length ?? 0),
    }
  })
  .filter((u) => u.unusableCodes !== '')
console.log(`\nUsers affected (${affected.length})`)
if (affected.length > 0) console.table(affected)

console.log(`\nEmails already in database (${usersResult.rows.length})`)
for (const { email } of usersResult.rows) console.log(`  - ${email}`)

if (toShow.length > 0) {
  console.log('\nTerritoire names of reviewed codes')
  console.table(toShow.map((c) => ({ code: c, name: byCode.get(c)?.name ?? '<missing>' })))
}
