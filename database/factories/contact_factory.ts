import factory from '@adonisjs/lucid/factories'
import Contact from '#models/contact'
import { ExploitationFactory } from '#database/factories/exploitation_factory'

export const ContactFactory = factory
  .define(Contact, async ({ faker }) => {
    return {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phoneNumber: faker.phone.number(),
    }
  })
  .relation('exploitation', () => ExploitationFactory)
  .build()
