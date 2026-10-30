import { type CommuneInfo, type CultureInfo } from './aac.js'
export type { CommuneInfo }

// Used for frontend forms and requests where id may be missing or null
export type ContactPayload = {
  id?: string | null
  firstName: string | null
  lastName: string | null
  role: string | null
  email: string | null
  isPrimaryContact: boolean
  phoneNumber: string | null
}

// The projets list itself is typed on the frontend with the generated Data.Project type
export type ProjetsTabsJson = {
  meta: {
    total: number
    perPage: number
    currentPage: number
    lastPage: number
  }
  queryString: {
    projetsRecherche: string
    projetsPage: string
    projetsStatut: string
    projetsTypesActionExclus: string
    projetsStatutsExclus: string
    projetsYearFrom: string
    projetsYearTo: string
  }
  availableActionTypes: string[]
  availableYearRange: { min: number; max: number }
  statusCounts: { to_be_started: number; current: number; completed: number; abandoned: number }
}

export type ProchainesTacheJson = {
  id: string
  titre: string
  date: string
  nomProjet?: string
  projetId?: string
  nomExploitation?: string
  exploitationId?: string
  // Only set for log-entry-sourced tasks: they can only be edited/completed/deleted by their author.
  userId?: string
}

export type AacSummaryJson = {
  code: string
  nom: string
  surface: number
  nb_captages_actifs: number
  nb_communes: number
  date_maj: string
  date_creation: string
  nb_parcelles: number
  communes: {
    nb_communes: number
    communes: Record<string, CommuneInfo>
  }
  surface_agricole_ppe: Record<string, CultureInfo>
  surface_agricole_ppr: Record<string, CultureInfo>
  surface_agricole_utile: Record<string, CultureInfo>
  surface_agricole_bio: {
    nb_parcelles: number
    surface: number
    part_bio: number
    evolution: { annee: number; nb_parcelles: number; surface: number }[]
  }
  bbox: [number, number, number, number] | null
  depassements_alerte: number
  depassements_reglementaires: number
}

// Output of Transformer.paginate() with Lucid paginator metadata
export type PaginatedJson<T> = {
  metadata: {
    total: number
    perPage: number
    currentPage: number
    lastPage: number
    firstPage: number
    firstPageUrl: string
    lastPageUrl: string
    nextPageUrl: string | null
    previousPageUrl: string | null
  }
  data: T[]
}
