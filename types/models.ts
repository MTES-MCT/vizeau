export type ContactJson = {
  id: string
  firstName: string | null
  lastName: string | null
  role: string | null
  email: string | null
  phoneNumber: string | null
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
