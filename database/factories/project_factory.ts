import factory from '@adonisjs/lucid/factories'
import { fakerFR as faker } from '@faker-js/faker'
import Project, { ProjectStatus } from '#models/project'
import { UserFactory } from '#database/factories/user_factory'
import { TerritoireFactory } from '#database/factories/territoire_factory'

const ProjectActionType = {
  STUDY: 'study',
  DIAGNOSIS: 'diagnosis',
  COORDINATION: 'coordination',
  WORKS: 'works',
  MONITORING: 'monitoring',
} as const

export const ProjectFactory = factory
  .define(Project, async () => {
    return {
      name: faker.company.catchPhrase(),
      description: faker.lorem.sentence(),
      actionType: faker.helpers.arrayElement(Object.values(ProjectActionType)),
      status: ProjectStatus.TO_BE_STARTED,
      closedAt: null,
    }
  })
  .relation('user', () => UserFactory)
  .relation('territoires', () => TerritoireFactory)
  .build()
