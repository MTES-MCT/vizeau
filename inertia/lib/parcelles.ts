/**
 * Helpers pour l'étape d'association de parcelles.
 * La recherche PACAGE reste FACTICE en attendant le back : seuls les numéros
 * 012345678 (2 parcelles), 087654321 (1 parcelle) et 111222333 (3 parcelles,
 * dont 2 déjà rattachées à une autre exploitation) renvoient des parcelles.
 */
import { manualParcelleKey, rpgParcelleKey } from '~/functions/parcelles'
import type { PacageGroup } from '~/functions/parcelles'

export type FetchedParcelle = {
  rpgId: string | null
  surface: number | null
  cultureCode: string | null
  isBio: boolean | null
  centroid: { x: number; y: number } | undefined
  year: number
}

export type PacageSearchResult =
  | { ok: true; parcelles: FetchedParcelle[] }
  | { ok: false; reason: 'invalid' | 'empty' | 'network' }

type FakeParcelle = Omit<FetchedParcelle, 'year'>

/**
 * FACTICE — PACAGE fictifs pour tester les ajouts groupés de plusieurs exploitants.
 * Tout autre numéro valide ne renvoie aucune parcelle.
 */
const FAKE_PACAGES: Record<string, FakeParcelle[]> = {
  '012345678': [
    {
      rpgId: '7320925',
      surface: 11.42,
      cultureCode: 'ORP',
      isBio: true,
      centroid: { x: 2.5417542227598524, y: 48.21043204946747 },
    },
    {
      rpgId: '5317167',
      surface: 8.3,
      cultureCode: 'BTH',
      isBio: false,
      centroid: { x: 2.550479926626171, y: 48.19914219139775 },
    },
  ],
  '087654321': [
    {
      rpgId: '11386355',
      surface: 15.81,
      cultureCode: 'TRN',
      isBio: true,
      centroid: { x: 2.591685887367204, y: 48.19919635411275 },
    },
  ],
  // Parcelles déjà associées : dépend de la base locale. En RPG 2024, 5280058 et 4226569
  // y sont rattachées à l'exploitation « REQUI (LE TRIVALOU) », 11380056 est libre.
  '111222333': [
    {
      rpgId: '11380056',
      surface: 7.45,
      cultureCode: 'ORP',
      isBio: false,
      centroid: { x: 2.5634028432248037, y: 48.2136878222496 },
    },
    {
      rpgId: '5280058',
      surface: 5.82,
      cultureCode: 'AVP',
      isBio: false,
      centroid: { x: 0.5940149125612691, y: 48.84780229425463 },
    },
    {
      rpgId: '4226569',
      surface: 12.09,
      cultureCode: 'AVH',
      isBio: false,
      centroid: { x: 0.597149194611124, y: 48.84874108647637 },
    },
  ],
}

/**
 * FACTICE — Recherche des parcelles d'un n° PACAGE dans le RPG.
 * Lit les PACAGE fictifs en attendant l'implémentation du back PACAGE.
 */
export async function searchParcellesByPacage(
  pacage: string,
  options?: { millesime?: number }
): Promise<PacageSearchResult> {
  if (!/^\d{9}$/.test(pacage)) {
    return { ok: false, reason: 'invalid' }
  }

  const fakeParcelles = FAKE_PACAGES[pacage]
  if (!fakeParcelles) {
    return { ok: false, reason: 'empty' }
  }

  const year = options?.millesime ?? 2024
  return { ok: true, parcelles: fakeParcelles.map((parcelle) => ({ ...parcelle, year })) }
}

/**
 * FACTICE — Numéro PACAGE sous lequel une parcelle RPG est déclarée, ou null si inconnu.
 * Le RPG public étant anonymisé, cette information devra venir du back.
 * Les parcelles des PACAGE fictifs renvoient le leur ; les autres sont réparties selon
 * leur identifiant entre les PACAGE fictifs et l'absence de PACAGE.
 */
export async function findPacageByRpgId(rpgId: string, _millesime: number): Promise<string | null> {
  for (const [pacage, parcelles] of Object.entries(FAKE_PACAGES)) {
    if (parcelles.some((parcelle) => parcelle.rpgId === rpgId)) return pacage
  }
  const pacages = [...Object.keys(FAKE_PACAGES), null]
  return pacages[Number(rpgId) % pacages.length] ?? null
}

/** Parcelles d'un PACAGE pour un millésime, prêtes à être ajoutées (cochées), ou null si aucune. */
export async function searchPacageGroup(
  pacage: string,
  millesime: number
): Promise<PacageGroup | null> {
  const result = await searchParcellesByPacage(pacage, { millesime })
  if (!result.ok) return null

  const addedAt = Date.now()
  return {
    pacage,
    year: millesime,
    parcelles: result.parcelles.map((parcelle, index) => ({
      // Sans identifiant RPG, la clé doit rester unique au sein du groupe.
      key: parcelle.rpgId
        ? rpgParcelleKey(parcelle.year, parcelle.rpgId)
        : manualParcelleKey(`${pacage}:${parcelle.year}:${index}`),
      rpgId: parcelle.rpgId,
      surface: parcelle.surface,
      cultureCode: parcelle.cultureCode,
      centroid: parcelle.centroid,
      year: parcelle.year,
      isBio: parcelle.isBio ?? undefined,
      pacage,
      addedAt,
      checked: true,
    })),
  }
}
