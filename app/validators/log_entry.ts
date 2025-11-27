import vine from '@vinejs/vine'

export const createLogEntryValidator = vine.compile(
  vine.object({
    notes: vine.string().maxLength(1000).optional().requiredIfMissing(['tags']),
    tags: vine
      .array(vine.number().positive().withoutDecimals())
      .optional()
      .requiredIfMissing(['notes']),
    params: vine.object({
      exploitationId: vine.string().uuid(),
    }),
  })
)
