import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { ExploitationFactory } from '#database/factories/exploitation_factory'
import { DateTime } from 'luxon'

/*
 * Seeder to create MVP data in production environment.
 * Should be deleted after the MVP test phase (around end of Jan 2026).
 */

const data = [
  {
    name: 'Ferme du Soleil',
    location: { x: 6.018186795950811, y: 49.154526631010015 },
    commune: 'Amanvilliers',
    postalCode: '57865',
    updatedAt: DateTime.local().plus({ minutes: 2 }),
  },
  {
    name: 'Domaine des Prés',
    location: { x: 6.0138907025611275, y: 49.15738495967216 },
    commune: 'Saint-Ail',
    postalCode: '54580',
    updatedAt: DateTime.local().plus({ minutes: 3 }),
  },
  {
    name: 'Exploitation de la Forêt',
    location: { x: 6.032383301300484, y: 49.1465742295334 },
    commune: 'Châtel-Saint-Germain',
    postalCode: '57160',
    updatedAt: DateTime.local().plus({ minutes: 4 }),
  },
  {
    name: 'Les Jardins de Lorraine',
    location: { x: 6.060531327698442, y: 49.132655955813505 },
    commune: 'Châtel-Saint-Germain',
    postalCode: '57160',
    updatedAt: DateTime.local().plus({ minutes: 5 }),
  },
  {
    name: 'Ferme du Canal',
    location: { x: 6.094243498850403, y: 49.13961558125058 },
    commune: 'Lorry-lès-Metz',
    postalCode: '57050',
    updatedAt: DateTime.local().plus({ minutes: 6 }),
  },
  {
    name: 'GAEC des Trois Rivières',
    location: { x: 6.077387413274437, y: 49.16145175233092 },
    commune: 'Saulny',
    postalCode: '57140',
    updatedAt: DateTime.local().plus({ minutes: 7 }),
  },
  {
    name: 'Ferme Bio de la Seille',
    location: { x: 6.118627544974885, y: 49.1512841445504 },
    commune: 'Saulny',
    postalCode: '57140',
    updatedAt: DateTime.local().plus({ minutes: 8 }),
  },
  {
    name: 'Exploitation du Moulin',
    location: { x: 6.108153860743386, y: 49.181673734162786 },
    commune: 'Norroy-le-Veneur',
    postalCode: '57140',
    updatedAt: DateTime.local().plus({ minutes: 9 }),
  },
  {
    name: 'Domaine de la Plaine',
    location: { x: 6.144811755587909, y: 49.18445494779269 },
    commune: 'Fèves',
    postalCode: '57280',
    updatedAt: DateTime.local().plus({ minutes: 10 }),
  },
  {
    name: 'Ferme des Coteaux',
    location: { x: 6.15283067008869, y: 49.1590973341078 },
    commune: 'Woippy',
    postalCode: '57140',
    updatedAt: DateTime.local().plus({ minutes: 11 }),
  },
]

export default class extends BaseSeeder {
  static environment = ['production']

  async run() {
    await ExploitationFactory.with('contacts', 1).merge(data).createMany(data.length)
  }
}
