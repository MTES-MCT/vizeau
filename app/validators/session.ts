import vine from '@vinejs/vine'

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().trim().toLowerCase(),
    password: vine.string(),
  })
)
