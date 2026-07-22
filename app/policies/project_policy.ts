import type User from '#models/user'
import Project from '#models/project'
import { BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class ProjectPolicy extends BasePolicy {
  /*
   * A user can view, edit or delete a project if they are the author,
   * or if they share at least one territoire (AAC) with the project.
   */
  async readWrite(user: User, project: Project): Promise<AuthorizerResponse> {
    if (project.userId === user.id) {
      return true
    }

    const commonTerritoires = await user
      .related('territoires')
      .query()
      .whereHas('projects', (projectsQuery) => {
        projectsQuery.where(`${Project.table}.id`, project.id)
      })
    return commonTerritoires.length > 0
  }
}
