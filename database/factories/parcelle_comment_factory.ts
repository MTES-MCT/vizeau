import factory from '@adonisjs/lucid/factories'
import ParcelleComment from '#models/parcelle_comment'
import { fakerFR as faker } from '@faker-js/faker'
import { ParcelleFactory } from '#database/factories/parcelle_factory'
import { UserFactory } from '#database/factories/user_factory'

export const ParcelleCommentFactory = factory
  .define(ParcelleComment, async () => {
    return {
      comment: faker.lorem.sentence(),
    }
  })
  .relation('parcelle', () => ParcelleFactory)
  .relation('user', () => UserFactory)
  .build()
