import 'server-only';
import { openDatabase, type Database } from './core.ts';
import { seedDemoContent } from './seed.ts';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';

/**
 * Process-wide database handle. Cached on globalThis so dev hot reloads reuse
 * one connection (PGlite allows a single opener per data directory).
 */
const globalForDb = globalThis as unknown as { __vybeDb?: Promise<Database> };

export function getDb(): Promise<Database> {
  if (!globalForDb.__vybeDb) {
    globalForDb.__vybeDb = (async () => {
      const db = await openDatabase({ url: env.databaseUrl, dataDir: env.dataDir });
      if (env.seedDemo) {
        try {
          await seedDemoContent(db);
        } catch (error) {
          logger.error('db.seed_failed', { error });
        }
      }
      logger.info('db.ready', { driver: db.driver });
      return db;
    })().catch((error) => {
      globalForDb.__vybeDb = undefined;
      throw error;
    });
  }
  return globalForDb.__vybeDb;
}

export type { Database, Queryable } from './core.ts';
