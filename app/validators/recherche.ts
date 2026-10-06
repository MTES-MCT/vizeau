import vine from '@vinejs/vine'

export const globalSearchValidator = vine.compile(
  vine.object({
    // Au moins 2 caractères, sauf pour un code (SANDRE…) : un seul chiffre suffit
    q: vine
      .string()
      .trim()
      .maxLength(100)
      .regex(/^(\d+|[\s\S]{2,})$/),
  })
)
