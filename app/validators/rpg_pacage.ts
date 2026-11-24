import vine from '@vinejs/vine'
import env from '#start/env'

/*
 * Paramètres des props `rpg*` de l'éditeur de parcelles, lus dans la requête du rechargement
 * partiel qui les demande.
 */

const millesime = () => vine.number().withoutDecimals().in(env.get('RPG_MILLESIMES').map(Number))

// Département sur 3 caractères (076, 02A et 02B pour la Corse…), puis 6 chiffres
const PACAGE_FORMAT = /^(\d{3}|02[AB])\d{6}$/

const NUMBER = '-?\\d+(?:\\.\\d+)?'

// Millésime du RPG seul
export const rpgMillesimeValidator = vine.compile(vine.object({ millesime: millesime() }))

// Parcelles d'un PACAGE
export const rpgPacageValidator = vine.compile(
  vine.object({
    millesime: millesime(),
    pacage: vine.string().regex(PACAGE_FORMAT),
  })
)

// PACAGE d'une parcelle choisie sur la carte, retrouvée par son identifiant et son centroïde
export const rpgParcellePacageValidator = vine.compile(
  vine.object({
    millesime: millesime(),
    rpgId: vine.string().regex(/^\d{1,16}$/),
    x: vine.number().min(-180).max(180),
    y: vine.number().min(-90).max(90),
  })
)

// PACAGE des parcelles d'une emprise « ouest,sud,est,nord » ; sa taille est contrôlée ensuite
export const rpgEmprisePacagesValidator = vine.compile(
  vine.object({
    millesime: millesime(),
    bbox: vine.string().regex(new RegExp(`^${NUMBER}(?:,${NUMBER}){3}$`)),
  })
)

// PACAGE des parcelles enregistrées d'une exploitation
export const rpgExploitationPacagesValidator = vine.compile(
  vine.object({
    millesime: millesime(),
    exploitationId: vine.string().uuid(),
  })
)
