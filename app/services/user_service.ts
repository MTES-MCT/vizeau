import User from '#models/user'
import Territoire from '#models/territoire'
import { userSeedsValidator } from '#validators/user_seed'
import db from '@adonisjs/lucid/services/db'
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

// Changes to the territoires of a user. A territoire is referenced by its AAC code or its UUID.
export type TerritoiresChange = {
  email: string
  add?: string[]
  remove?: string[]
  // Exact list of the user's territoires, like Lucid's sync(): the others are detached.
  // Cannot be combined with add or remove.
  sync?: string[]
}

export type TerritoiresChangeResult = {
  email: string
  userFound: boolean
  attached: Territoire[]
  detached: Territoire[]
  // Territoires of the user once the changes are applied, ordered by code
  territoires: Territoire[]
  // References matching no territoire
  notFound: string[]
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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
   * Attaches and detaches the territoires of users, referenced by AAC code or UUID.
   * Changes given several times for the same email are merged. Unknown references are
   * reported in notFound and ignored, except with sync: detaching from an incomplete list
   * would remove territoires by mistake, so the whole call is rejected. Users that don't exist
   * are reported with userFound false. Everything is written in a single transaction, and
   * nothing with dryRun.
   */
  async updateTerritoires(
    changes: TerritoiresChange[],
    { dryRun = false }: { dryRun?: boolean } = {}
  ): Promise<TerritoiresChangeResult[]> {
    const changesByEmail = this.mergeTerritoiresChanges(changes)
    const refs = [...changesByEmail.values()].flatMap((c) => [...c.add, ...c.remove, ...c.sync])
    const resolved = await this.resolveTerritoires(refs)

    const unknownSyncRefs = [...changesByEmail.values()]
      .flatMap((c) => [...c.sync])
      .filter((ref) => !resolved.has(ref))
    if (unknownSyncRefs.length > 0) {
      throw new Error(
        `Territoires not found, nothing synced: ${[...new Set(unknownSyncRefs)].join(', ')}`
      )
    }

    return db.transaction(async (trx) => {
      const users = await User.query({ client: trx })
        .whereIn('email', [...changesByEmail.keys()])
        .preload('territoires')
      const userByEmail = new Map(users.map((u) => [u.email, u]))

      // Every territoire involved, ordered by code, to order the lists of the result
      const involvedIds = new Set([
        ...[...resolved.values()].map((t) => t.id),
        ...users.flatMap((u) => u.territoires.map((t) => t.id)),
      ])
      const orderedTerritoires = await Territoire.query({ client: trx })
        .whereIn('id', [...involvedIds])
        .withScopes((scopes) => scopes.orderByCode())
      const pick = (ids: Set<string>) => orderedTerritoires.filter((t) => ids.has(t.id))
      const resolveIds = (_refs: Set<string>) =>
        new Set([..._refs].filter((ref) => resolved.has(ref)).map((ref) => resolved.get(ref)!.id))

      const results: TerritoiresChangeResult[] = []
      for (const [email, change] of changesByEmail) {
        const notFound = [...change.add, ...change.remove].filter((ref) => !resolved.has(ref))
        const user = userByEmail.get(email)
        if (!user) {
          results.push({
            email,
            userFound: false,
            attached: [],
            detached: [],
            territoires: [],
            notFound,
          })
          continue
        }

        const currentIds = new Set(user.territoires.map((t) => t.id))
        const toAttach = change.isSync ? resolveIds(change.sync) : resolveIds(change.add)
        const attachedIds = new Set([...toAttach].filter((id) => !currentIds.has(id)))
        const detachedIds = change.isSync
          ? new Set([...currentIds].filter((id) => !toAttach.has(id)))
          : new Set([...resolveIds(change.remove)].filter((id) => currentIds.has(id)))
        const finalIds = new Set(
          [...currentIds, ...attachedIds].filter((id) => !detachedIds.has(id))
        )

        if (!dryRun) {
          if (attachedIds.size > 0) {
            await user.related('territoires').attach([...attachedIds], trx)
          }
          if (detachedIds.size > 0) {
            await user.related('territoires').detach([...detachedIds], trx)
          }
        }

        results.push({
          email,
          userFound: true,
          attached: pick(attachedIds),
          detached: pick(detachedIds),
          territoires: pick(finalIds),
          notFound,
        })
      }
      return results
    })
  }

  /**
   * Merges the changes by lowercased email, and checks that they are consistent.
   */
  private mergeTerritoiresChanges(changes: TerritoiresChange[]) {
    const byEmail = new Map<
      string,
      { add: Set<string>; remove: Set<string>; sync: Set<string>; isSync: boolean }
    >()
    for (const change of changes) {
      const email = change.email.toLowerCase().trim()
      if (!byEmail.has(email)) {
        byEmail.set(email, { add: new Set(), remove: new Set(), sync: new Set(), isSync: false })
      }
      const merged = byEmail.get(email)!
      const trim = (refs?: string[]) => (refs ?? []).map((ref) => ref.trim()).filter(Boolean)
      trim(change.add).forEach((ref) => merged.add.add(ref))
      trim(change.remove).forEach((ref) => merged.remove.add(ref))
      trim(change.sync).forEach((ref) => merged.sync.add(ref))
      merged.isSync ||= change.sync !== undefined
    }

    for (const [email, change] of byEmail) {
      if (change.isSync && (change.add.size > 0 || change.remove.size > 0)) {
        throw new Error(`"${email}": sync cannot be combined with add or remove`)
      }
      const both = [...change.add].filter((ref) => change.remove.has(ref))
      if (both.length > 0) {
        throw new Error(`"${email}": both added and removed: ${both.join(', ')}`)
      }
    }
    return byEmail
  }

  /**
   * Finds the territoires referenced by AAC code or UUID, keyed by reference.
   */
  private async resolveTerritoires(refs: string[]): Promise<Map<string, Territoire>> {
    const ids = refs.filter((ref) => UUID_REGEX.test(ref))
    const codes = refs.filter((ref) => !UUID_REGEX.test(ref))
    const territoires = await Territoire.query().whereIn('code', codes).orWhereIn('id', ids)

    const resolved = new Map<string, Territoire>()
    for (const territoire of territoires) {
      if (territoire.code) resolved.set(territoire.code, territoire)
      resolved.set(territoire.id, territoire)
    }
    return resolved
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
