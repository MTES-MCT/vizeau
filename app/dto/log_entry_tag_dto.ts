import { LogEntryTagJson } from '../../types/models.js'
import LogEntryTag from '#models/log_entry_tag'

export class LogEntryTagDto {
  constructor(private tags: LogEntryTag[]) {}

  static fromModel(tag: LogEntryTag): LogEntryTagJson {
    return {
      id: tag.id,
      name: tag.name,
    }
  }

  toArray(): LogEntryTagJson[] {
    return this.tags.map(LogEntryTagDto.fromModel)
  }
}
