import type { Data } from '@generated/data'

export function displayContactName(contact?: Data.Contact) {
  if (!contact) {
    return 'Non renseigné'
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

export function getMainContact(contacts?: Data.Contact[]) {
  if (contacts && contacts.length > 0) {
    return contacts[0]
  }

  return undefined
}
