#!/bin/sh
# Verifies the schema, RLS policies and fulfilment functions on a disposable
# PostgreSQL database (NOT a Supabase project): DATABASE_URL must point to an
# empty database you can drop afterwards.
set -eu
: "${DATABASE_URL:?Set DATABASE_URL to an empty, disposable PostgreSQL database}"
cd "$(dirname "$0")/.."
set -- -f supabase/tests/00_local_stubs.sql
for migration in supabase/migrations/*.sql; do set -- "$@" -f "$migration"; done
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q "$@" -f supabase/seed.sql -f supabase/tests/10_rls.test.sql
