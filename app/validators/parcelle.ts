import vine from '@vinejs/vine'

export const assignParcellesToExploitationValidator = vine.compile(
  vine.object({
    exploitationId: vine.string().uuid(),
    year: vine.number().withoutDecimals().min(1900).max(new Date().getFullYear()),
    parcelles: vine.array(
      vine.object({
        rpgId: vine.string().maxLength(10),
        surface: vine.number().min(0).optional(),
        cultureCode: vine.string().maxLength(3).optional(),
      })
    ),
  })
)

export const detachParcelleValidator = vine.compile(
  vine.object({
    params: vine.object({
      exploitationId: vine.string().uuid(),
      rpgId: vine.string().maxLength(10),
    }),
    year: vine.number().withoutDecimals().min(1900).max(new Date().getFullYear()),
  })
)
