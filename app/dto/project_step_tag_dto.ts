import { type ProjectStepTagJson } from '#types/models'
import type ProjectStepTag from '#models/project_step_tag'

export class ProjectStepTagDto {
  static fromModel(tag: ProjectStepTag): ProjectStepTagJson {
    return {
      id: tag.id,
      name: tag.name,
    }
  }

  static fromArray(tags: ProjectStepTag[]): ProjectStepTagJson[] {
    return tags.map(ProjectStepTagDto.fromModel)
  }
}
