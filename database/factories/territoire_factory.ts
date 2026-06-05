import factory from '@adonisjs/lucid/factories'
import Territoire from '#models/territoire'
import { fakerFR as faker } from '@faker-js/faker'

export const TerritoireFactory = factory
  .define(Territoire, async () => {
    return {
      name: faker.location.county(),
      code: faker.string.alphanumeric(10),
    }
  })
  .state('nonAAC', (territoire) => {
    territoire.code = null
  })
  .build()
