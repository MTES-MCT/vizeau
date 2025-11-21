export async function getAddressFromCoords({ lat, lon }: { lat: number; lon: number }) {
  const response = await fetch(
    `https://data.geopf.fr/geocodage/reverse?index=address&lon=${lon}&lat=${lat}`
  )

  const adresses = await response.json()

  return adresses.features[0]
}
