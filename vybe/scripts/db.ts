/**
 * Database CLI.
 *   npm run db:migrate            apply pending migrations
 *   npm run db:seed               create the demo profiles (idempotent)
 *   npm run admin:grant -- <email> give an existing account the admin role
 * Uses DATABASE_URL when set, otherwise the embedded PGlite database in VYBE_DATA_DIR.
 */
import { openDatabase, runMigrations } from '../src/lib/db/core.ts';
import { seedDemoContent } from '../src/lib/db/seed.ts';

const [command, arg] = process.argv.slice(2);
const db = await openDatabase({ migrate: false });
try {
  if (command === 'migrate') {
    const ran = await runMigrations(db);
    console.log(ran.length ? `Applied: ${ran.join(', ')}` : 'Database is up to date.');
  } else if (command === 'seed') {
    await runMigrations(db);
    console.log(`Created ${await seedDemoContent(db)} demo profile(s).`);
  } else if (command === 'grant-admin') {
    if (!arg) throw new Error('Usage: npm run admin:grant -- someone@example.com');
    const rows = await db.query(`update users set role = 'admin', updated_at = now() where lower(email) = lower($1) returning id`, [arg]);
    console.log(rows.length ? `${arg} is now an admin.` : `No account found for ${arg}.`);
  } else {
    console.log('Commands: migrate | seed | grant-admin <email>');
    process.exitCode = 1;
  }
} finally {
  await db.close();
}
