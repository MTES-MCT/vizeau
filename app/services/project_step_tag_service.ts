import ProjectStepTag from '#models/project_step_tag'
import { errors } from '@adonisjs/auth'
import ProjectStep from '#models/project_step'

export class ProjectStepTagService {
  async createTagForUser(userId: string, tagName: string) {
    return await ProjectStepTag.create({
      name: tagName,
      userId,
    })
  }

  async getTagsForUser(userId: string, searchQuery?: string, limit?: number) {
    const query = ProjectStepTag.query().where('userId', userId).orderBy('updatedAt', 'desc')

    if (searchQuery) {
      query.andWhere('name', 'ilike', `%${searchQuery}%`)
    }

    if (limit) {
      query.limit(limit)
    }

    return query.exec()
  }

  async getTagsForStep(stepId: string) {
    return ProjectStepTag.query()
      .whereHas('steps', (query) => {
        query.where(`${ProjectStep.table}.id`, stepId)
      })
      .exec()
  }

  async updateTag(tagId: number, tagName: string, userId: string) {
    const tag = await ProjectStepTag.findOrFail(tagId)

    if (tag.userId !== userId) {
      throw errors.E_UNAUTHORIZED_ACCESS
    }

    tag.name = tagName
    await tag.save()
    return tag
  }

  async deleteTag(tagId: number, userId: string) {
    const tag = await ProjectStepTag.findOrFail(tagId)

    if (tag.userId !== userId) {
      throw errors.E_UNAUTHORIZED_ACCESS
    }

    await tag.delete()
    return tag
  }
}
