-- VYBE initial schema. Plain PostgreSQL (14+); also runs on embedded PGlite.
-- All access goes through the server (src/lib/db); the database is never exposed
-- to browsers, so authorization is enforced in the service layer.

create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  password_hash text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index users_email_key on users (lower(email));

create table sessions (
  id text primary key, -- sha256 of the cookie token; the raw token is never stored
  user_id uuid not null references users (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create index sessions_user_idx on sessions (user_id);
create index sessions_expires_idx on sessions (expires_at);

create table password_resets (
  token_hash text primary key,
  user_id uuid not null references users (id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table user_preferences (
  user_id uuid primary key references users (id) on delete cascade,
  editor jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Uploaded files. storage_key is internal and never sent to browsers.
create table assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  kind text not null check (kind in ('image', 'video', 'audio', 'font')),
  mime text not null,
  ext text not null,
  size_bytes integer not null check (size_bytes > 0),
  filename text not null,
  storage_key text not null unique,
  poster_key text,
  visibility text not null default 'unlisted' check (visibility in ('private', 'unlisted', 'public')),
  width integer,
  height integer,
  duration_seconds real,
  sha256 text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index assets_user_idx on assets (user_id, created_at desc);
create index assets_public_idx on assets (visibility, created_at desc) where visibility = 'public';

create table profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users (id) on delete cascade,
  username text not null,
  display_name text not null default '',
  description text not null default '',
  status_text text not null default '',
  location text not null default '',
  pronouns text not null default '',
  avatar_asset_id uuid references assets (id) on delete set null,
  banner_asset_id uuid references assets (id) on delete set null,
  theme jsonb not null default '{}'::jsonb,
  seo jsonb not null default '{}'::jsonb,
  visibility text not null default 'public' check (visibility in ('public', 'unlisted')),
  -- Draft/publish: editors write the relational rows below; publishing freezes
  -- the public view into published_snapshot.
  is_published boolean not null default false,
  published_snapshot jsonb,
  published_at timestamptz,
  revision integer not null default 0,
  view_count integer not null default 0,
  is_demo boolean not null default false,
  is_featured boolean not null default false,
  -- Verification is granted only by administrators, never sold.
  is_verified boolean not null default false,
  suspended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index profiles_username_key on profiles (lower(username));
create index profiles_public_idx on profiles (is_published, visibility, view_count desc);
create index profiles_published_at_idx on profiles (published_at desc) where is_published;

create table profile_aliases (
  alias text primary key, -- stored lower-case
  profile_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index profile_aliases_profile_idx on profile_aliases (profile_id);

create table tabs (
  id uuid primary key,
  profile_id uuid not null references profiles (id) on delete cascade,
  label text not null,
  icon text not null default '',
  position integer not null default 0
);
create index tabs_profile_idx on tabs (profile_id, position);

-- Social links and custom buttons share one table, distinguished by kind.
create table links (
  id uuid primary key,
  profile_id uuid not null references profiles (id) on delete cascade,
  kind text not null default 'social' check (kind in ('social', 'button')),
  platform text not null,
  url text not null,
  label text not null default '',
  icon_asset_id uuid references assets (id) on delete set null,
  accent text,
  display_mode text not null default 'icon',
  new_tab boolean not null default true,
  visible boolean not null default true,
  position integer not null default 0
);
create index links_profile_idx on links (profile_id, position);

create table widgets (
  id uuid primary key,
  profile_id uuid not null references profiles (id) on delete cascade,
  tab_id uuid references tabs (id) on delete set null,
  type text not null,
  config jsonb not null default '{}'::jsonb,
  size text not null default 'full',
  visible boolean not null default true,
  position integer not null default 0
);
create index widgets_profile_idx on widgets (profile_id, position);

create table badges (
  id uuid primary key,
  profile_id uuid not null references profiles (id) on delete cascade,
  label text not null,
  icon text not null,
  color text not null,
  background text not null,
  border text not null,
  tooltip text not null default '',
  url text,
  visible boolean not null default true,
  position integer not null default 0
);
create index badges_profile_idx on badges (profile_id, position);

create table audio_tracks (
  id uuid primary key,
  profile_id uuid not null references profiles (id) on delete cascade,
  asset_id uuid references assets (id) on delete set null,
  title text not null,
  artist text not null default '',
  cover_asset_id uuid references assets (id) on delete set null,
  position integer not null default 0
);
create index audio_tracks_profile_idx on audio_tracks (profile_id, position);

-- Saved theme configurations. user_id null = built-in preset.
create table theme_presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users (id) on delete cascade,
  name text not null,
  theme jsonb not null,
  created_at timestamptz not null default now()
);
create index theme_presets_user_idx on theme_presets (user_id, created_at desc);

-- Privacy-conscious analytics: no IP addresses, no fingerprints, coarse fields only.
create table analytics_events (
  id bigserial primary key,
  profile_id uuid not null references profiles (id) on delete cascade,
  type text not null check (type in ('view', 'click', 'widget')),
  target_id uuid,
  referrer_host text,
  device text not null default 'unknown',
  country text,
  created_at timestamptz not null default now()
);
create index analytics_events_profile_idx on analytics_events (profile_id, created_at desc);
create index analytics_events_target_idx on analytics_events (profile_id, type, target_id);

-- One row per visitor-hash per profile per UTC day, used to count unique views.
-- The hash is salted with a server secret and the date, and rows are pruned.
create table view_dedup (
  profile_id uuid not null references profiles (id) on delete cascade,
  visitor_hash text not null,
  day date not null,
  primary key (profile_id, visitor_hash, day)
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('profile', 'media')),
  target_id uuid not null,
  reason text not null,
  details text not null default '',
  reporter_user_id uuid references users (id) on delete set null,
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  resolved_by uuid references users (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index reports_status_idx on reports (status, created_at desc);

create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  topic text not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- Fixed-window rate limiting shared by all server instances.
create table rate_limits (
  key text not null,
  window_start timestamptz not null,
  count integer not null default 0,
  primary key (key, window_start)
);
