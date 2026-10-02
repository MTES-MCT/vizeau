import User from '#models/user'
import Territoire from '#models/territoire'
import { userSeedsValidator } from '#validators/user_seed'
import { errors } from '@vinejs/vine'
import { randomBytes } from 'node:crypto'
import { readFile } from 'node:fs/promises'

export type UserSeeds = Array<{
  email: string
  fullName?: string
  password?: string
  // AAC Codes
  territoireCodes?: string[]
  // Territoire UUIDs
  territoireIds?: string[]
}>

export type SeedUsersResult = {
  created: string[]
  // Emails already in the database: skipped, or updated (password included) with resetPasswords
  existing: string[]
}

export type AssignTerritoiresResult = Array<{
  email: string
  userFound: boolean
  // Territoires newly attached to the user (already attached ones are not counted)
  attached: number
  notFoundCodes: string[]
  notFoundIds: string[]
}>

export default class UserService {
  /**
   * Reads and validates a batch of users from a JSON file.
   */
  async readUserSeeds(filePath: string): Promise<UserSeeds> {
    const content = await readFile(filePath, 'utf-8')
    try {
      return await userSeedsValidator.validate(JSON.parse(content))
    } catch (error) {
      if (error instanceof errors.E_VALIDATION_ERROR) {
        const messages = (error.messages as Array<{ field: string; message: string }>).map(
          ({ field, message }) => `${field}: ${message}`
        )
        throw new Error(`Invalid users batch:\n${messages.join('\n')}`)
      }
      throw error
    }
  }

  /**
   * Creates the users that don't exist yet. Existing users are left untouched, unless
   * resetPasswords is set: they are then updated, and their password is overwritten.
   * With dryRun, nothing is written.
   */
  async seedUsers(
    usersToSeed: UserSeeds,
    { resetPasswords = false, dryRun = false }: { resetPasswords?: boolean; dryRun?: boolean } = {}
  ): Promise<SeedUsersResult> {
    const byEmail = new Map(
      usersToSeed.map((user) => {
        const email = user.email.toLowerCase().trim()
        // fullName is left out when missing, so that an update doesn't erase the existing one
        return [
          email,
          { email, password: user.password, ...(user.fullName && { fullName: user.fullName }) },
        ]
      })
    )
    const users = [...byEmail.values()]

    const existingUsers = await User.query().whereIn('email', [...byEmail.keys()])
    const existingEmails = new Set(existingUsers.map((user) => user.email))
    const newUsers = users.filter((user) => !existingEmails.has(user.email))

    const missingPasswords = (resetPasswords ? users : newUsers)
      .filter((user) => !user.password)
      .map((user) => user.email)
    if (missingPasswords.length > 0) {
      throw new Error(`Missing password for: ${missingPasswords.join(', ')}`)
    }

    if (!dryRun) {
      if (resetPasswords) {
        await User.updateOrCreateMany('email', users)
      } else {
        await User.createMany(newUsers)
      }
    }

    return {
      created: newUsers.map((user) => user.email),
      existing: [...existingEmails],
    }
  }

  /**
   * Attaches the territoires of the batch to its users, never detaches.
   * territoireCodes is useful for AACs from the SANDRE national referential, while territoireIds
   * can be used for any existing territoire. Both are read when present. With dryRun, nothing
   * is written.
   */
  async assignTerritoires(
    usersToSeed: UserSeeds,
    { dryRun = false }: { dryRun?: boolean } = {}
  ): Promise<AssignTerritoiresResult> {
    const codes = usersToSeed.flatMap((u) => u.territoireCodes ?? [])
    const ids = usersToSeed.flatMap((u) => u.territoireIds ?? [])
    const territoires = await Territoire.query().whereIn('code', codes).orWhereIn('id', ids)
    const idByCode = new Map(territoires.map((t) => [t.code, t.id]))
    const knownIds = new Set(territoires.map((t) => t.id))

    const emails = usersToSeed.map((u) => u.email.toLowerCase().trim())
    const users = await User.query().whereIn('email', emails).preload('territoires')
    const userByEmail = new Map(users.map((u) => [u.email, u]))
    // Kept up to date, so that an email listed twice doesn't attach a territoire twice
    const currentIdsByEmail = new Map(
      users.map((u) => [u.email, new Set(u.territoires.map((t) => t.id))])
    )

    const result: AssignTerritoiresResult = []
    for (const userData of usersToSeed) {
      const email = userData.email.toLowerCase().trim()
      const userCodes = userData.territoireCodes ?? []
      const userIds = userData.territoireIds ?? []
      const territoireIds = new Set([
        ...userCodes.filter((c) => idByCode.has(c)).map((c) => idByCode.get(c)!),
        ...userIds.filter((id) => knownIds.has(id)),
      ])
      const entry = {
        email,
        userFound: false,
        attached: 0,
        notFoundCodes: userCodes.filter((c) => !idByCode.has(c)),
        notFoundIds: userIds.filter((id) => !knownIds.has(id)),
      }
      result.push(entry)

      const user = userByEmail.get(email)
      if (!user) continue

      const currentIds = currentIdsByEmail.get(email)!
      const newIds = [...territoireIds].filter((id) => !currentIds.has(id))
      if (!dryRun && newIds.length > 0) {
        await user.related('territoires').attach(newIds)
      }
      newIds.forEach((id) => currentIds.add(id))
      entry.userFound = true
      entry.attached = newIds.length
    }
    return result
  }

  /**
   * Generates a secure random password, hashes it, and saves it for the given user.
   * Returns the plain-text generated password so the caller can display it.
   * The plain-text password is never persisted anywhere in the application.
   */
  async resetPassword(email: string): Promise<string> {
    const user = await User.findBy('email', email.toLowerCase().trim())
    if (!user) {
      throw new Error(`User with email "${email}" not found`)
    }

    // 9 bytes → 12-character base64url string (no padding)
    const plainPassword = randomBytes(9).toString('base64url')

    user.password = plainPassword
    await user.save()

    return plainPassword
  }
}
