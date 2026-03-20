import { CultureInfo } from './aac.js'
// Types for AAC data models
export type CommuneInfo = {
  code_insee: string
  surface: number
  repartition: number
}

// Used for frontend forms and requests where id may be missing or null
export type ExploitationFormValues = Omit<ExploitationJson, 'id' | 'contacts'> & {
  id?: string | null | undefined
  contacts: ContactPayload[]
}
// Used for frontend forms and requests where id may be missing or null
export type ContactPayload = Omit<ContactJson, 'id'> & {
  id?: string | null
}

export type ContactJson = {
  id: string
  firstName: string | null
  lastName: string | null
  role: string | null
  email: string | null
  isPrimaryContact: boolean
  phoneNumber: string | null
}

export type ExploitationTagJson = {
  id: number
  name: string
  group: string
}

export type LogEntryTagJson = {
  id: number
  name: string
  userId: string
  exploitationId: string
  createdAt: string
  updatedAt: string
}

export type LogEntryDocumentJson = {
  id: number
  name: string
  logEntryId: string
  sizeInBytes: number
  href: string
}

export type LogEntryJson = {
  id: string
  title: string | null
  notes: string | null
  userId: string
  exploitation?: ExploitationJson
  exploitationId: string
  createdAt: string
  updatedAt: string
  tags?: LogEntryTagJson[] | null
  date: string | null
  isCompleted: boolean
  documents?: LogEntryDocumentJson[] | null
}

export type ParcelleJson = {
  id: string
  year: number
  rpgId: string
  exploitationId: string | null
  surface: number | null
  cultureCode: string | null
  centroid: { x: number; y: number } | null
  comment: string | null
}

export type ExploitationJson = {
  id: string
  name: string
  formeJuridique: string | null
  siret: string | null
  denominationLegale: string | null
  activite: string | null
  addressLine1: string | null
  addressLine2: string | null
  postalCode: string | null
  postalBox: string | null
  commune: string | null
  location: { x: number; y: number } | null
  notes: string | null
  contacts?: ContactJson[] | null
  tags?: ExploitationTagJson[] | null
  logEntries?: LogEntryJson[] | null
  parcelles?: ParcelleJson[] | null
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
}

export type PaginatedJson<T> = {
  meta: {
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
