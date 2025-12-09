import { LogEntryTagJson } from '../../types/models.js'
import LogEntryTag from '#models/log_entry_tag'

export class LogEntryTagDto {
  static fromModel(tag: LogEntryTag): LogEntryTagJson {
    return {
      id: tag.id,
      name: tag.name,
      userId: tag.userId,
      exploitationId: tag.exploitationId,
      createdAt: tag.createdAt.toISO() as string,
      updatedAt: tag.updatedAt.toISO() as string,
    }
  }

  static fromArray(tags: LogEntryTag[]): LogEntryTagJson[] {
    return tags.map(LogEntryTagDto.fromModel)
  }
}
