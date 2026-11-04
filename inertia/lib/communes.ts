export type AddressFeature = {
  type: 'Feature'
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
  properties: {
    name: string
    label: string
    postcode: string
    citycode: string
    city: string
    score: number
    context: string
  }
}

export async function getAddressFromCoords({
  lat,
  lon,
}: {
  lat: number
  lon: number
}): Promise<AddressFeature | null> {
  const response = await fetch(
    `https://data.geopf.fr/geocodage/reverse?index=address&lon=${lon}&lat=${lat}`
  )

  const adresses = await response.json()

  return adresses.features[0]
}

/**
 * Nom de la commune contenant le point, via l'API Géo (découpage administratif).
 * Renvoie null si le point est hors commune ou si l'appel échoue.
 */
export async function getCommuneNameFromCoords({
  lat,
  lon,
}: {
  lat: number
  lon: number
}): Promise<string | null> {
  try {
    const response = await fetch(
      `https://geo.api.gouv.fr/communes?lat=${lat}&lon=${lon}&fields=nom&format=json`
    )
    if (!response.ok) return null
    const communes: Array<{ nom: string }> = await response.json()
    return communes[0]?.nom ?? null
  } catch {
    return null
  }
}
