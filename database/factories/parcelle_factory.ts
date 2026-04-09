import factory from '@adonisjs/lucid/factories'
import Parcelle from '#models/parcelle'
import { ExploitationFactory } from '#database/factories/exploitation_factory'
import { fakerFR as faker } from '@faker-js/faker'

export const ParcelleFactory = factory
  .define(Parcelle, async () => {
    return {
      year: faker.number.int({ min: 2020, max: 2026 }),
      rpgId: faker.string.numeric(10),
      surface: faker.number.float({ min: 0.1, max: 100, fractionDigits: 2 }),
      cultureCode: null,
      comment: null,
      centroid: null,
    }
  })
  .relation('exploitation', () => ExploitationFactory)
  .build()
