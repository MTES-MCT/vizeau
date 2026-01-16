import factory from '@adonisjs/lucid/factories'
import User from '#models/user'
import { fakerFR as faker } from '@faker-js/faker'

export const UserFactory = factory
  .define(User, async () => {
    return {
      fullName: faker.person.fullName(),
      email: faker.internet.email(),
      password: 'password',
    }
  })
  .build()
