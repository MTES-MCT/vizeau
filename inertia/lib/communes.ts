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
