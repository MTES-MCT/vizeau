import vine from '@vinejs/vine'

export const createLogEntryTagValidator = vine.compile(
  vine.object({
    name: vine.string().maxLength(50),
    params: vine.object({
      exploitationId: vine.string().uuid(),
    }),
  })
)

export const deleteLogEntryTagValidator = vine.compile(
  vine.object({
    tagId: vine.number().min(1),
    params: vine.object({
      exploitationId: vine.string().uuid(),
    }),
  })
)
