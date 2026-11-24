import { router, usePage } from '@inertiajs/react'
import type { SelectedParcelle } from '~/components/map/parcelles-selection-map'
import type { RpgPacageResult, RpgParcelle } from '#types/rpg'

/** Département sur 3 caractères (076, 02A et 02B pour la Corse…), puis 6 chiffres. */
export const PACAGE_FORMAT = /^(\d{3}|02[AB])\d{6}$/

/** Parcelle d'un PACAGE, telle que la sélection la garde. */
export const toSelectedParcelle = ({
  rpgId,
  surface,
  cultureCode,
  centroid,
}: RpgParcelle): SelectedParcelle => ({ rpgId, surface, cultureCode, centroid })

/**
 * Demande au serveur une prop `rpg*` de la page, par un rechargement partiel qui laisse l'URL
 * telle quelle (voir doc/front-end/parcelles-rpg.md). `null` si les paramètres sont invalides.
 */
function loadRpgProp<T>(prop: string, data: Record<string, string>) {
  return new Promise<T | null>((resolve, reject) => {
    const fail = () => {
      reject(new Error(`Chargement de ${prop} impossible`))
      // L'éditeur affiche l'échec lui-même, sans la fenêtre d'erreur d'Inertia
      return false
    }
    router.reload({
      only: [prop],
      data,
      preserveUrl: true,
      onSuccess: (page) => resolve(((page.props as Record<string, unknown>)[prop] as T) ?? null),
      onError: fail,
      onCancel: fail,
      onHttpException: fail,
      onNetworkError: fail,
    })
  })
}

/** Parcelles déclarées sous ce PACAGE pour le millésime. */
export function searchPacage(pacage: string, millesime: string) {
  return loadRpgProp<RpgPacageResult>('rpgPacage', { millesime, pacage })
}

/** PACAGE sous lequel la parcelle est déclarée, avec ses parcelles. */
export async function findParcellePacage(parcelle: SelectedParcelle, millesime: string) {
  if (!parcelle.centroid) return null
  const { x, y } = parcelle.centroid
  return loadRpgProp<RpgPacageResult>('rpgParcellePacage', {
    millesime,
    rpgId: parcelle.rpgId,
    x: String(x),
    y: String(y),
  })
}

/** La recherche par PACAGE n'est proposée que si le serveur lit les Parquet du RPG. */
export const usePacageSearchAvailable = () => Boolean(usePage().props.rpgPacageSearch)
