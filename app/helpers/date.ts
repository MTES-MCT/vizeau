import type { DateTime } from 'luxon'

/*
 * Serialize a Luxon DateTime to an ISO string.
 * Transformers must not return DateTime instances: Inertia SSR receives the props without
 * JSON serialization, so the server and the client would render different values.
 */
export function toISODateTime(value: DateTime | null | undefined): string | null {
  return value?.toISO() ?? null
}
