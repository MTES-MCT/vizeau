import { LogEntryTagJson } from '../../types/models.js'
import LogEntryTag from '#models/log_entry_tag'

export class LogEntryTagDto {
  constructor(private tags: LogEntryTag[]) {}

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

  toArray(): LogEntryTagJson[] {
    return this.tags.map(LogEntryTagDto.fromModel)
  }
}
