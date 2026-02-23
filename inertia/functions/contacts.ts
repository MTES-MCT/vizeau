import { ContactJson } from '../../types/models.js'

export function displayContactName(contact?: ContactJson) {
  if (!contact) {
    return 'N/A'
  }

  if (contact.firstName && contact.lastName) {
    return `${contact.firstName} ${contact.lastName}`
  }
  if (contact.firstName) {
    return contact.firstName
  }
  if (contact.lastName) {
    return contact.lastName
  }

  return 'Non renseigné'
}
