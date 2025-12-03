import LogEntryTag from '#models/log_entry_tag'

export class LogEntryTagService {
  /*
   * Create a new tag for a given exploitation. Only tags from the current exploitation will be selectable for log entries.
   * User ids are stored to track who created which tag but is not used for permission checks.
   */
  async createTagForExploitation(exploitationId: string, userId: string, tagName: string) {
    return await LogEntryTag.create({
      name: tagName,
      exploitationId,
      userId,
    })
  }

  async getTagsForExploitation(exploitationId: string, searchQuery?: string, limit?: number) {
    const query = LogEntryTag.query()
      .where('exploitationId', exploitationId)
      .orderBy('updatedAt', 'desc')

    if (searchQuery) {
      query.andWhere('name', 'ilike', `%${searchQuery}%`)
    }

    if (limit) {
      query.limit(limit)
    }

    return query.exec()
  }

  async updateTag(tagId: number, tagName: string) {
    const tag = await LogEntryTag.findOrFail(tagId)
    tag.name = tagName
    await tag.save()
    return tag
  }

  // For security, we require the parent exploitation id to ensure the tag belongs to the correct exploitation
  async deleteTag(tagId: number, parentExploitationId: string) {
    const tag = await LogEntryTag.findByOrFail({ id: tagId, exploitationId: parentExploitationId })

    await tag.delete()
    return tag
  }
}
