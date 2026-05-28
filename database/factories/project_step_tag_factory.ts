import factory from '@adonisjs/lucid/factories'
import { fakerFR as faker } from '@faker-js/faker'
import ProjectStepTag from '#models/project_step_tag'
import { UserFactory } from '#database/factories/user_factory'

export const ProjectStepTagFactory = factory
  .define(ProjectStepTag, async () => {
    return {
      name: faker.lorem.word(),
    }
  })
  .relation('owner', () => UserFactory)
  .build()
