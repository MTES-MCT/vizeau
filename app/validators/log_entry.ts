import vine from '@vinejs/vine'

const logEntryFormFieldsValidator = {
  notes: vine.string().maxLength(1000).optional().requiredIfMissing(['tags']),
  tags: vine
    .array(vine.number().positive().withoutDecimals())
    .optional()
    .requiredIfMissing(['notes']),
  params: vine.object({
    exploitationId: vine.string().uuid(),
  }),
}

export const createLogEntryValidator = vine.compile(
  vine.object({
    ...logEntryFormFieldsValidator,
  })
)

// Same but with params for the exploitation ID
export const updateLogEntryValidator = vine.compile(
  vine.object({
    ...logEntryFormFieldsValidator,
    id: vine.string().uuid(),
  })
)

export const destroyLogEntryValidator = vine.compile(
  vine.object({
    id: vine.string().uuid(),
    params: vine.object({
      exploitationId: vine.string().uuid(),
    }),
  })
)
