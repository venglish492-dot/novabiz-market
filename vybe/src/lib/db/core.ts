/**
 * Database access shared by the app and the CLI scripts (so: no `server-only`,
 * no path aliases). One SQL dialect — PostgreSQL — runs on two drivers:
 *
 *  - `DATABASE_URL` set  → node-postgres pool (Supabase, Neon, RDS, local Postgres…)
 *  - `DATABASE_URL` empty → embedded PGlite persisted under VYBE_DATA_DIR/pglite.
 *    Zero-config local development and single-instance deployments.
 *
 * Migrations in db/migrations run automatically on first connection unless
 * VYBE_AUTO_MIGRATE=false (then run `npm run db:migrate`).
 */
import fs from 'node:fs';
import path from 'node:path';

export type Row = Record<string, unknown>;

export interface Queryable {
  query<T = Row>(sql: string, params?: unknown[]): Promise<T[]>;
  /** Runs a multi-statement script without parameters (migrations). */
  exec(sql: string): Promise<void>;
}

export interface Database extends Queryable {
  one<T = Row>(sql: string, params?: unknown[]): Promise<T | null>;
  tx<T>(fn: (q: Queryable) => Promise<T>): Promise<T>;
  driver: 'postgres' | 'pglite';
  close(): Promise<void>;
}

type Driver = {
  name: 'postgres' | 'pglite';
  query(sql: string, params: unknown[]): Promise<Row[]>;
  exec(sql: string): Promise<void>;
  tx<T>(fn: (q: Queryable) => Promise<T>): Promise<T>;
  close(): Promise<void>;
};

async function createPostgresDriver(url: string): Promise<Driver> {
  const pg = await import('pg');
  const Pool = pg.default?.Pool ?? (pg as unknown as { Pool: typeof import('pg').Pool }).Pool;
  const pool = new Pool({
    connectionString: url,
    max: Number(process.env.DATABASE_POOL_MAX || 10),
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });
  return {
    name: 'postgres',
    async query(sql, params) {
      const result = await pool.query(sql, params as unknown[]);
      return result.rows;
    },
    async exec(sql) {
      await pool.query(sql);
    },
    async tx(fn) {
      const client = await pool.connect();
      try {
        await client.query('begin');
        const value = await fn({
          async query<T>(sql: string, params: unknown[] = []) {
            return (await client.query(sql, params)).rows as T[];
          },
          async exec(sql: string) {
            await client.query(sql);
          },
        });
        await client.query('commit');
        return value;
      } catch (error) {
        await client.query('rollback').catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    },
    close: () => pool.end(),
  };
}

async function createPgliteDriver(dataDir: string): Promise<Driver> {
  const { PGlite } = await import('@electric-sql/pglite');
  const dir = path.join(dataDir, 'pglite');
  fs.mkdirSync(dir, { recursive: true });
  const db = await PGlite.create(dir);
  return {
    name: 'pglite',
    async query(sql, params) {
      return (await db.query<Row>(sql, params)).rows;
    },
    async exec(sql) {
      await db.exec(sql);
    },
    async tx(fn) {
      return db.transaction(async (tx) =>
        fn({
          async query<T>(sql: string, params: unknown[] = []) {
            return (await tx.query<T>(sql, params)).rows;
          },
          async exec(sql: string) {
            await tx.exec(sql);
          },
        }),
      );
    },
    close: () => db.close(),
  };
}

function migrationsDir(): string {
  return path.join(process.cwd(), 'db', 'migrations');
}

export async function runMigrations(db: Pick<Database, 'query' | 'tx' | 'driver'>): Promise<string[]> {
  await db.query(`create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())`);
  const files = fs
    .readdirSync(migrationsDir())
    .filter((file) => file.endsWith('.sql'))
    .sort();
  const applied = new Set((await db.query<{ name: string }>('select name from schema_migrations')).map((row) => row.name));
  const ran: string[] = [];
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(migrationsDir(), file), 'utf8');
    await db.tx(async (q) => {
      if (db.driver === 'postgres') {
        // Serialize concurrent migrators (several instances booting at once).
        await q.query('select pg_advisory_xact_lock(727274)');
        const again = await q.query('select 1 from schema_migrations where name = $1', [file]);
        if (again.length) return;
      }
      await q.exec(sql);
      await q.query('insert into schema_migrations (name) values ($1)', [file]);
    });
    ran.push(file);
  }
  return ran;
}

export async function openDatabase(options: { url?: string; dataDir?: string; migrate?: boolean } = {}): Promise<Database> {
  const url = options.url ?? process.env.DATABASE_URL ?? '';
  const dataDir = path.resolve(/*turbopackIgnore: true*/ options.dataDir ?? process.env.VYBE_DATA_DIR ?? '.data');
  const driver = url ? await createPostgresDriver(url) : await createPgliteDriver(dataDir);

  const database: Database = {
    driver: driver.name,
    query: <T = Row>(sql: string, params: unknown[] = []) => driver.query(sql, params) as Promise<T[]>,
    async one<T = Row>(sql: string, params: unknown[] = []) {
      const rows = (await driver.query(sql, params)) as T[];
      return rows[0] ?? null;
    },
    exec: (sql: string) => driver.exec(sql),
    tx: (fn) => driver.tx(fn),
    close: () => driver.close(),
  };

  if (options.migrate ?? process.env.VYBE_AUTO_MIGRATE !== 'false') {
    await runMigrations(database);
  }
  return database;
}
