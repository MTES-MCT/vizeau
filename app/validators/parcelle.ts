import vine from '@vinejs/vine'

export const assignParcellesToExploitationValidator = vine.compile(
  vine.object({
    exploitationId: vine.string().uuid(),
    parcelles: vine.array(
      vine.object({
        rpgId: vine.string(),
        surface: vine.number().min(0).optional(),
        cultureCode: vine.string().maxLength(3).optional(),
      })
    ),
  })
)
