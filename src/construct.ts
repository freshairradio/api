import { sql, multiple } from './db'

const bootstrap = async () => {
  await multiple(sql`
    drop table if exists users cascade;
    drop table if exists shows cascade;
    drop table if exists link_show_user cascade;
    drop table if exists episodes cascade;
    drop table if exists link_show_episode cascade;

    create table users (
        identifier uuid primary key,
        name text,
        username text unique,
        bio text,
        profile_picture text,
        created timestamp,
        updated timestamp
    );
    create table shows (
        identifier uuid primary key,
        title text,
        description text,
        slug text unique,
        picture text,
        meta jsonb,
        created timestamp,
        updated timestamp
    );
    create table link_show_user (
        identifier uuid primary key,
        "show" uuid references shows,
        "user" uuid references users
    );
    create table episodes (
        identifier uuid primary key,
        title text,
        description text,
        slug text unique,
        audio text,
        meta jsonb,
        created timestamp,
        updated timestamp
    );
    create table link_show_episode (
        identifier uuid primary key,
        "show" uuid references shows,
        "episode" uuid references episodes
    );
    insert into users(identifier) values ('2db7300d-4911-4271-98d2-3143f776fbaf');
    `)
  process.exit(0)
}
bootstrap()
