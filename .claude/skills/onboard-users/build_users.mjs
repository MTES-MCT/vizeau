#!/usr/bin/env node
// Builds a users batch for user:seed --file from a contact list.
// Usage: node build_users.mjs <input> [--name <batchName>] [--out-dir <dir>]
//          [--exclude <row>:<number>,...] [--exclude-email <email>,...]
//
// Supported inputs:
//   - simple CSV (comma):  territoireCodes,territoireIds,email,fullName
//   - SANDRE export (semicolon): columns BAC, Nom, Prénom, Action, Email.
//     Only rows whose Action contains "Code SANDRE OK" are kept, codes are read from BAC.
//   - account request form (comma or semicolon): columns Nom, Prénom, Email, BAC, no Action.
//     BAC is either a plain code list ("43;56") or free text ("AAC du Porche code SANDRE : 1364",
//     "Lucelle 5263, Oltingue 5276"...): every standalone number is taken as a code. In free text,
//     numbers that may belong to an AAC name or be a department ("Coupeaume 2", "Carentoir (56)")
//     are kept but listed for review; drop them with --exclude <row>:<number>, row being the
//     1-based data row. Plain code lists are never flagged.
//     An optional Creation column (true/false) skips the rows already created.
//   - JSON array already shaped like the batch (missing passwords are generated)
//
// --exclude-email removes people from the batch (e.g. none of their codes exist).
//
// Outputs, in --out-dir (default tmp/onboarding):
//   <name>.json              the batch, read by user:seed and user:assign-territoires with --file
//   <name>_credentials.md    name / email / password blocks, to send to the users
// Passwords are never printed on stdout.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { resolve, extname } from 'node:path'

const CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const PASSWORD_LENGTH = 10
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
// A BAC cell holding only codes and separators, e.g. "5738; 371;5739" or "5125;4891."
const CODE_LIST_REGEX = /^[\d\s;,.]*$/
const TRUTHY_REGEX = /^(true|vrai|oui|yes|x|1)$/i

function parseArgs(argv) {
  const options = {
    input: null,
    name: null,
    outDir: 'tmp/onboarding',
    exclude: new Set(),
    excludeEmails: new Set(),
  }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--name') options.name = argv[++i]
    else if (argv[i] === '--out-dir') options.outDir = argv[++i]
    else if (argv[i] === '--exclude') parseList(argv[++i]).forEach((e) => options.exclude.add(e))
    else if (argv[i] === '--exclude-email') {
      parseList(argv[++i]).forEach((e) => options.excludeEmails.add(e.toLowerCase()))
    } else options.input = argv[i]
  }
  if (!options.input) {
    console.error('Usage: node build_users.mjs <input> [--name <batchName>] [--out-dir <dir>]')
    process.exit(1)
  }
  options.name ??= `USERS_${new Date().toISOString().slice(0, 10)}`
  return options
}

// Unbiased random password: bytes above the largest multiple of the charset size are dropped
function generatePassword() {
  const limit = CHARSET.length * Math.floor(256 / CHARSET.length)
  let password = ''
  while (password.length < PASSWORD_LENGTH) {
    for (const byte of randomBytes(PASSWORD_LENGTH * 2)) {
      if (byte < limit) password += CHARSET[byte % CHARSET.length]
      if (password.length === PASSWORD_LENGTH) break
    }
  }
  return password
}

// CSV parser handling quoted cells, escaped quotes and multiline cells
function parseCsv(content, separator) {
  const rows = []
  let row = []
  let field = ''
  let insideQuotes = false

  for (let i = 0; i < content.length; i++) {
    const char = content[i]
    if (insideQuotes) {
      if (char === '"' && content[i + 1] === '"') {
        field += '"'
        i++
      } else if (char === '"') {
        insideQuotes = false
      } else {
        field += char
      }
    } else if (char === '"') {
      insideQuotes = true
    } else if (char === separator) {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      row.push(field.replace(/\r$/, ''))
      rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field.replace(/\r$/, ''))
    rows.push(row)
  }
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ''))
}

function parseList(value) {
  return (value ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v !== '')
}

// SANDRE codes are stored without leading zeros in territoires.code
function normalizeCode(code) {
  const trimmed = String(code).trim()
  return /^\d+$/.test(trimmed) ? String(Number(trimmed)) : trimmed
}

// Matches numbers after ": " or "N°" in the BAC column of the SANDRE export
function extractSandreCodes(bac) {
  return [...bac.matchAll(/(?::\s*|N°)(\d+)/g)].map((m) => m[1])
}

// Free-text BAC: every standalone number is a candidate code. Short numbers right after a word
// ("Coupeaume 2", "SUIPPES 1") or alone in parentheses ("(56)") are often part of a name or a
// department, but can also be real codes ("Moulines Tournebu 78"), so they are only flagged.
function extractFreeTextCodes(bac, row, options, review) {
  if (CODE_LIST_REGEX.test(bac)) {
    return (bac.match(/\d+/g) ?? []).filter((number) => !options.exclude.has(`${row}:${number}`))
  }

  const codes = []
  for (const match of bac.matchAll(/\b\d+\b/g)) {
    const number = match[0]
    if (options.exclude.has(`${row}:${number}`)) continue
    codes.push(number)

    const before = bac.slice(Math.max(0, match.index - 25), match.index)
    const after = bac.slice(match.index + number.length, match.index + number.length + 15)
    const afterWord = /\p{L}\s+$/u.test(before) && !/(code|sandre|cdaac)\s*$/i.test(before)
    const inParentheses = before.endsWith('(') && after.startsWith(')')
    if (number.length <= 2 && (afterWord || inParentheses)) {
      review.push({ row, number, context: `…${before}[${number}]${after}…`.replace(/\s+/g, ' ') })
    }
  }
  return codes
}

function readContacts(inputPath, skipped, options, review) {
  const content = readFileSync(inputPath, 'utf-8').replace(/^﻿/, '')

  if (extname(inputPath).toLowerCase() === '.json') {
    return JSON.parse(content)
  }

  const firstLine = content.slice(0, content.indexOf('\n'))
  const separator = firstLine.includes(';') ? ';' : ','
  const [header, ...rows] = parseCsv(content, separator)
  const columns = header.map((h) => h.trim())
  const col = (row, name) => row[columns.indexOf(name)]?.trim() ?? ''

  if (columns.includes('BAC') && columns.includes('Action')) {
    console.log('Format: SANDRE export (semicolon)')
    return rows.flatMap((row, i) => {
      const email = col(row, 'Email')
      const action = col(row, 'Action')
      if (!action.includes('Code SANDRE OK')) {
        skipped.push({ row: i + 1, email, reason: `Action: "${action.replace(/\s+/g, ' ')}"` })
        return []
      }
      return [
        {
          email,
          fullName: `${col(row, 'Prénom')} ${col(row, 'Nom')}`.trim(),
          territoireCodes: extractSandreCodes(col(row, 'BAC')),
          territoireIds: [],
        },
      ]
    })
  }

  if (columns.includes('BAC') && columns.includes('Email')) {
    const freeTextRows = rows.filter((row) => !CODE_LIST_REGEX.test(col(row, 'BAC'))).length
    console.log(
      freeTextRows === 0
        ? 'Format: account request form, BAC holds code lists only (nothing to review)'
        : `Format: account request form, BAC is free text in ${freeTextRows}/${rows.length} row(s)`
    )
    return rows.flatMap((row, i) => {
      const email = col(row, 'Email')
      if (columns.includes('Creation') && TRUTHY_REGEX.test(col(row, 'Creation'))) {
        skipped.push({ row: i + 1, email, reason: 'already created (Creation column)' })
        return []
      }
      return [
        {
          row: i + 1,
          email,
          fullName: `${col(row, 'Prénom')} ${col(row, 'Nom')}`.trim(),
          territoireCodes: extractFreeTextCodes(col(row, 'BAC'), i + 1, options, review),
          territoireIds: [],
        },
      ]
    })
  }

  if (columns.includes('email')) {
    console.log('Format: simple CSV (territoireCodes,territoireIds,email,fullName)')
    return rows.map((row, i) => ({
      row: i + 1,
      email: col(row, 'email'),
      fullName: col(row, 'fullName'),
      territoireCodes: parseList(col(row, 'territoireCodes')),
      territoireIds: parseList(col(row, 'territoireIds')),
    }))
  }

  console.error(`Unknown format, header is: ${columns.join(' | ')}`)
  process.exit(1)
}

function main() {
  const options = parseArgs(process.argv.slice(2))
  const skipped = []
  const warnings = []
  const review = []
  const contacts = readContacts(resolve(options.input), skipped, options, review)

  // Deduplicate by email, merging territoires
  const byEmail = new Map()
  for (const contact of contacts) {
    const email = (contact.email ?? '').trim().toLowerCase()
    if (!EMAIL_REGEX.test(email)) {
      skipped.push({ row: contact.row, email: contact.email ?? '', reason: 'invalid email' })
      continue
    }
    if (options.excludeEmails.has(email)) {
      skipped.push({ row: contact.row, email, reason: 'excluded with --exclude-email' })
      continue
    }

    const codes = (contact.territoireCodes ?? []).map(normalizeCode)
    const ids = (contact.territoireIds ?? []).map((id) => id.trim())
    for (const id of ids.filter((i) => !UUID_REGEX.test(i))) {
      warnings.push(`${email}: "${id}" is not a UUID`)
    }

    const existing = byEmail.get(email)
    if (existing) {
      warnings.push(`${email}: duplicated, territoires merged`)
      existing.territoireCodes = [...new Set([...existing.territoireCodes, ...codes])]
      existing.territoireIds = [...new Set([...existing.territoireIds, ...ids])]
      continue
    }

    byEmail.set(email, {
      email,
      fullName: contact.fullName?.trim() ?? '',
      password: contact.password || generatePassword(),
      territoireCodes: [...new Set(codes)],
      territoireIds: [...new Set(ids)],
    })
  }

  const users = [...byEmail.values()]
  for (const user of users) {
    if (!user.fullName) warnings.push(`${user.email}: no full name`)
    if (user.territoireCodes.length === 0 && user.territoireIds.length === 0) {
      warnings.push(`${user.email}: no territoire`)
    }
  }

  const outDir = resolve(options.outDir)
  mkdirSync(outDir, { recursive: true })
  const base = resolve(outDir, options.name)
  writeFileSync(`${base}.json`, JSON.stringify(users, null, 2) + '\n', 'utf-8')
  writeFileSync(
    `${base}_credentials.md`,
    users.map((u) => `${u.fullName}\n${u.email}\n${u.password}`).join('\n\n\n') + '\n',
    'utf-8'
  )

  const allCodes = [...new Set(users.flatMap((u) => u.territoireCodes))]
  console.log(`\nUsers in batch: ${users.length}`)
  console.table(
    users.map((u) => ({
      email: u.email,
      fullName: u.fullName,
      territoireCodes: u.territoireCodes.join(', '),
      territoireIds: u.territoireIds.length,
    }))
  )
  console.log(`\nSkipped rows (${skipped.length})`)
  if (skipped.length > 0) console.table(skipped)
  console.log(`\nNumbers to review, maybe not codes (${review.length})`)
  if (review.length > 0) console.table(review)
  console.log(`\nWarnings (${warnings.length})`)
  for (const warning of warnings) console.log(`  - ${warning}`)
  console.log(`\nDistinct territoire codes (${allCodes.length}): ${allCodes.join(',')}`)
  console.log(`\nFiles written:\n  ${base}.json\n  ${base}_credentials.md`)
}

main()
