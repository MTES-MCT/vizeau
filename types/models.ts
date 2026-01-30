export type ContactJson = {
  id: string
  firstName: string | null
  lastName: string | null
  role: string | null
  email: string | null
  phoneNumber: string | null
}

export type ExploitationTagJson = {
  id: number
  name: string
}

export type LogEntryTagJson = {
  id: number
  name: string
  userId: string
  exploitationId: string
  createdAt: string
  updatedAt: string
}

export type LogEntryJson = {
  id: string
  title: string | null
  notes: string | null
  userId: string
  exploitationId: string
  createdAt: string
  updatedAt: string
  tags?: LogEntryTagJson[] | null
}

export type ParcelleJson = {
  id: string
  year: number
  rpgId: string
  exploitationId: string | null
  surface: number | null
  cultureCode: string | null
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
  isDemo: boolean
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
