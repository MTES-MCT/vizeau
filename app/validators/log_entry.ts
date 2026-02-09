import vine from '@vinejs/vine'
import { DateTime } from 'luxon'

const logEntryFormFieldsValidator = {
  title: vine.string().maxLength(255).nullable().optional().requiredIfMissing(['notes', 'tags']),
  notes: vine.string().maxLength(1000).nullable().optional().requiredIfMissing(['title', 'tags']),
  tags: vine
    .array(vine.number().positive().withoutDecimals())
    .optional()
    .requiredIfMissing(['title', 'notes']),
  date: vine
    .date()
    .nullable()
    .optional()
    .transform((value) => (value ? DateTime.fromJSDate(value) : value)),
  documents: vine.array(vine.file({ extnames: ['pdf'], size: '10MB' })).optional(),
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

export const completeLogEntryValidator = vine.compile(
  vine.object({
    id: vine.string().uuid(),
    params: vine.object({
      exploitationId: vine.string().uuid(),
    }),
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
