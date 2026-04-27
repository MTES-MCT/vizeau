import factory from '@adonisjs/lucid/factories'
import { fakerFR as faker } from '@faker-js/faker'
import Captage from '#models/captage'

export const CaptageFactory = factory
  .define(Captage, async () => {
    return {
      code: faker.string.alphanumeric({ length: 8, casing: 'upper' }),
      name: faker.location.city(),
      bssCode: faker.string.alphanumeric({ length: 12, casing: 'upper' }),
      state: faker.helpers.arrayElement(['active', 'inactive', 'abandoned']),
    }
  })
  .build()
