import factory from '@adonisjs/lucid/factories'
import Contact from '#models/contact'
import { ExploitationFactory } from '#database/factories/exploitation_factory'

export const ContactFactory = factory
  .define(Contact, async ({ faker }) => {
    return {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      role: faker.person.jobTitle(),
      email: faker.internet.email(),
      phoneNumber: faker.phone.number(),
    }
  })
  .relation('exploitation', () => ExploitationFactory)
  .build()
