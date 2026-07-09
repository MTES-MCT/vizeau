import ParcelleComment from '#models/parcelle_comment'

export class ParcelleCommentService {
  /*
   * Create or update the comment a given user left on a given parcelle.
   */
  async upsertComment(
    parcelleId: string,
    userId: string,
    comment: string | null
  ): Promise<ParcelleComment> {
    return await ParcelleComment.updateOrCreate({ parcelleId, userId }, { comment })
  }
}
