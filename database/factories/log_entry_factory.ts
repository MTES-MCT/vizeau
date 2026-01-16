import factory from '@adonisjs/lucid/factories'
import LogEntry from '#models/log_entry'
import { UserFactory } from '#database/factories/user_factory'
import { ExploitationFactory } from '#database/factories/exploitation_factory'
import { LogEntryTagFactory } from '#database/factories/log_entry_tag_factory'
import { fakerFR as faker } from '@faker-js/faker'

export const LogEntryFactory = factory
  .define(LogEntry, async () => {
    return {
      notes: faker.lorem.paragraph(),
    }
  })
  .relation('author', () => UserFactory)
  .relation('exploitation', () => ExploitationFactory)
  .relation('tags', () => LogEntryTagFactory)
  .build()
