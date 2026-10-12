import { RealityDB, setDbForTests } from '@/db/database'
import { initDatabase } from '@/db/init'
import { saveProfile } from '@/db/config'
import { parseProfile } from '@/domain/settings'

let counter = 0

/** Creates an isolated in-memory (fake-indexeddb) database for one test. */
export async function freshDb(opts: { onboarded?: boolean } = {}): Promise<RealityDB> {
  const db = new RealityDB(`test-db-${Date.now()}-${counter++}`)
  setDbForTests(db)
  await initDatabase(db)
  if (opts.onboarded) await saveProfile(parseProfile({ displayName: 'Tester', onboardingComplete: true, introSeen: true }))
  return db
}
