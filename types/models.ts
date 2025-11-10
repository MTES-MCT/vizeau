import { ExploitationTypeStructure } from '#models/exploitation'

export type ContactJson = {
  id: string
  name: string | null
  email: string | null
  phoneNumber: string | null
}

export type ExploitationJson = {
  id: string
  name: string
  typeStructure: ExploitationTypeStructure | null
  siret: string | null
  addressLine1: string | null
  addressLine2: string | null
  postalCode: string | null
  postalBox: string | null
  commune: string | null
  location: { x: number; y: number } | null
  notes: string | null
  contacts?: ContactJson[] | null
}

export type PaginatedExploitationJson = {
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
  data: ExploitationJson[]
}
