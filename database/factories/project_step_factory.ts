import factory from '@adonisjs/lucid/factories'
import { fakerFR as faker } from '@faker-js/faker'
import ProjectStep from '#models/project_step'
import { ProjectFactory } from '#database/factories/project_factory'
import { ProjectStepTagFactory } from '#database/factories/project_step_tag_factory'

export const ProjectStepFactory = factory
  .define(ProjectStep, async () => {
    return {
      title: faker.lorem.sentence(),
      note: faker.lorem.paragraph(),
      isValidated: false,
    }
  })
  .relation('project', () => ProjectFactory)
  .relation('tags', () => ProjectStepTagFactory)
  .build()
