export function exportExploitationsAsCSV<T extends Record<string, any>>(
  data: T[] = [],
  filename = 'data.csv'
) {
  if (data.length === 0) return

  // Transformation des données
  const transformedData = data.map((row) => {
    const { id, location, contacts, ...rest } = row

    // Trouver le contact principal
    const primaryContact = Array.isArray(contacts)
      ? contacts.find((c: any) => c.isPrimaryContact) || contacts[0]
      : null

    return {
      ...rest,
      longitude: location?.x ?? '',
      latitude: location?.y ?? '',
      contact_prenom: primaryContact?.firstName ?? '',
      contact_nom: primaryContact?.lastName ?? '',
      contact_email: primaryContact?.email ?? '',
      contact_telephone: primaryContact?.phoneNumber ?? '',
      contact_role: primaryContact?.role ?? '',
    }
  })

  const headers = Object.keys(transformedData[0])
  const csvContent = [
    headers.join(','),
    ...transformedData.map((row) =>
      headers.map((header) => JSON.stringify(row[header] ?? '')).join(',')
    ),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.append(link)
  link.click()
  link.remove()
}
