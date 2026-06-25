import fs from 'fs'
import fsp from 'fs/promises'

/**
 * Vérifie l'existence d'un fichier et lance une erreur explicite si absent.
 * @param {string} filePath
 */
export function checkFileExists(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`❌ Fichier non trouvé : ${filePath}`)
  }
}

/**
 * Normalise une chaîne : minuscules, trim, suppression des accents,
 * et réduction des espaces multiples.
 * @param {string} value
 * @returns {string}
 */
export function normalizeString(value) {
  return String(value ?? '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

/**
 * Auto-détection du délimiteur CSV (`,` ou `;`) en se basant sur la première ligne.
 * @param {string} filePath
 * @returns {Promise<string>}
 */
export async function detectDelimiter(filePath) {
  try {
    const firstLine = await fsp.readFile(filePath, 'utf8').then((content) => content.split('\n')[0])

    const commaCount = (firstLine.match(/,/g) || []).length
    const semicolonCount = (firstLine.match(/;/g) || []).length

    return semicolonCount > commaCount ? ';' : ','
  } catch {
    console.warn('⚠️ Impossible de détecter le délimiteur, utilisation du défaut (`,`)')
    return ','
  }
}
