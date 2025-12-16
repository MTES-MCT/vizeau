import vine from '@vinejs/vine'

export const createParcelleValidator = vine.compile(
  vine.object({
    exploitationId: vine.string().optional(),
    rpgId: vine.string(),
    year: vine.number().withoutDecimals().min(1900).max(new Date().getFullYear()),
    surface: vine.number().min(0).optional(),
    cultureCode: vine.string().maxLength(3).optional(),
  })
)
