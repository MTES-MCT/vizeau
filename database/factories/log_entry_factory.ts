import factory from '@adonisjs/lucid/factories'
import LogEntry from '#models/log_entry'
import { UserFactory } from '#database/factories/user_factory'
import { ExploitationFactory } from '#database/factories/exploitation_factory'
import { LogEntryTagFactory } from '#database/factories/log_entry_tag_factory'

export const LogEntryFactory = factory
  .define(LogEntry, async ({ faker }) => {
    return {
      notes: faker.lorem.paragraph(),
    }
  })
  .relation('author', () => UserFactory)
  .relation('exploitation', () => ExploitationFactory)
  .relation('tags', () => LogEntryTagFactory)
  .build()
