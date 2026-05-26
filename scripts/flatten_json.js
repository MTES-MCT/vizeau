#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, basename, dirname } from 'node:path'

const input = process.argv[2]

if (!input) {
  console.error('Usage: node flatten_json.js <file.json>')
  process.exit(1)
}

const inputPath = resolve(input)
const content = JSON.parse(readFileSync(inputPath, 'utf-8'))
const flattened = JSON.stringify(content)

const name = basename(inputPath, '.json')
const outputPath = resolve(dirname(inputPath), `${name}_flattened.json`)

writeFileSync(outputPath, flattened, 'utf-8')
console.log(`Written to ${outputPath}`)
