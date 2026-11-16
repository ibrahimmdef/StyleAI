-- StyleAI database. Run it with: npm run db:setup
-- Safe to run again: tables that already exist are left alone.
--
-- Every table except users has a user_id, so each person only sees their own things.
-- Deleting a user deletes everything of theirs (on delete cascade).
-- Categories, colors and styles aren't checked here, they change too often.
-- The backend checks them against src/shared/catalog.js instead.

create table if not exists users (
  id bigint generated always as identity primary key,
  -- Always saved in lower case, so "Ali@x.com" and "ali@x.com" are one account
  email text not null unique check (email = lower(email)),
  -- Never the password itself, only its bcrypt hash
  password_hash text not null,
  name text not null,
  photo text not null default '',
  created_at timestamptz not null default now()
);

-- Who is logged in. The browser keeps a random token in a cookie,
-- we keep only its hash, so a leaked database can't be used to log in.
create table if not exists sessions (
  token_hash text primary key,
  user_id bigint not null references users (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists sessions_user_id on sessions (user_id);

create table if not exists items (
  id bigint generated always as identity primary key,
  user_id bigint not null references users (id) on delete cascade,
  name text not null,
  category text not null,
  type text not null,
  color text not null,
  seasons text[] not null default '{}',
  styles text[] not null default '{}',
  -- Path like /uploads/123.webp, the frontend adds the server address
  image text not null,
  created_at timestamptz not null default now()
);
create index if not exists items_user_id on items (user_id);

create table if not exists outfits (
  id bigint generated always as identity primary key,
  user_id bigint not null references users (id) on delete cascade,
  -- The outfit as text ("12|7|-|3|-|-"), so the same outfit isn't saved twice
  key text not null,
  name text not null,
  occasion text not null default 'Casual',
  -- { "top": 12, "bottom": 7, ... } item ids. A deleted item just drops out.
  slots jsonb not null,
  favorite boolean not null default false,
  saved_at timestamptz not null default now(),
  unique (user_id, key)
);
create index if not exists outfits_user_id on outfits (user_id);

-- One row per user, made when they sign up
create table if not exists preferences (
  user_id bigint primary key references users (id) on delete cascade,
  styles text[] not null default '{Casual}',
  colors text[] not null default '{}',
  avoid_colors text[] not null default '{}',
  cold_tolerance smallint not null default 3 check (cold_tolerance between 1 and 5),
  unit text not null default 'C' check (unit in ('C', 'F')),
  occasions text[] not null default '{Casual}',
  seasons text[] not null default '{}',
  notifications boolean not null default true
);

-- "Forgot password" links. Like sessions, only the hash of the token is kept.
-- A link works once and for one hour.
create table if not exists password_resets (
  token_hash text primary key,
  user_id bigint not null references users (id) on delete cascade,
  expires_at timestamptz not null
);
