import factory from '@adonisjs/lucid/factories'
import { UserFactory } from '#database/factories/user_factory'
import { ExploitationFactory } from '#database/factories/exploitation_factory'
import LogEntryTag from '#models/log_entry_tag'
import { fakerFR as faker } from '@faker-js/faker'

export const LogEntryTagFactory = factory
  .define(LogEntryTag, async () => {
    return {
      name: faker.lorem.word(),
    }
  })
  .relation('owner', () => UserFactory)
  .relation('exploitation', () => ExploitationFactory)
  .build()
