import vine from '@vinejs/vine'

// Batch of users given to user:seed and user:assign-territoires with --file
export const userSeedsValidator = vine.compile(
  vine.array(
    vine.object({
      email: vine.string().trim().email(),
      fullName: vine.string().trim().optional(),
      password: vine.string().optional(),
      // AAC codes
      territoireCodes: vine.array(vine.string().trim()).optional(),
      // Territoire UUIDs
      territoireIds: vine.array(vine.string().trim().uuid()).optional(),
    })
  )
)
