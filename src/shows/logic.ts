import {
  Show,
  BaseShow,
  ShowLink,
  BaseEpisode,
  Episode,
  EpisodeLink
} from './types'
import { multiple, sql, single } from '../db'
import { v4 } from 'uuid'
import moment from 'moment'
import pat from 'consts:pat'
export const getAllForUser = async (userId: string): Promise<Show[]> => {
  return await multiple(
    sql`select 
            shows.*, 
            json_agg(distinct users) as users, 
            coalesce(json_agg(distinct episodes) filter (where episodes.identifier is not null), '[]') as episodes 
            from shows 
          join link_show_user as l 
            on shows.identifier=l.show 
          join users 
            on l.user=users.identifier
          left join link_show_episode as le 
            on shows.identifier=le.show
          left join episodes
            on le.episode=episodes.identifier
          where
            users.identifier=${userId}
          group by
            shows.identifier`
  )
}
export const getBySlug = async (slug: string): Promise<Show[]> => {
  return await single(
    sql`select 
              shows.*, 
              json_agg(distinct users) as users, 
              coalesce(json_agg(distinct episodes) filter (where episodes.identifier is not null), '[]') as episodes 
              from shows 
            left join link_show_user as l 
              on shows.identifier=l.show
            left join users 
              on l.user=users.identifier
            left join link_show_episode as le 
              on shows.identifier=le.show
            left join episodes
              on le.episode=episodes.identifier
            where
              shows.slug=${slug}
            group by
              shows.identifier`
  )
}

export const createShow = async (
  userId: string,
  { title, description, slug, picture, meta = {} }: BaseShow
): Promise<Show> => {
  const show: Show = {
    title,
    description,
    slug,
    picture,
    meta,
    identifier: v4(),
    updated: moment(),
    created: moment()
  }
  const inserted: Show = await single(
    sql`insert into shows 
          (identifier, title, description, slug, picture, created, updated, meta)
          values 
          (${show.identifier}, 
            ${show.title}, 
            ${show.description}, 
            ${show.slug}, 
            ${show.picture}, 
            ${show.created}, 
            ${show.updated},
            ${show.meta})
          returning *`
  )
  const link: ShowLink = await single(
    sql`insert into link_show_user 
          (identifier, "user", show)
          values 
            (${v4()}, ${userId}, ${show.identifier})
          returning *`
  )
  return inserted
}
export const updateShow = async (
  showId: string,
  { title, description, slug, picture, meta = {} }: BaseShow
): Promise<Show> => {
  const updated: Show = await single(
    sql`update shows
          set 
            title=${title},
            description=${description},
            slug=${slug},
            picture=${picture},
            updated=${moment()},
            meta=${meta}
          where
            shows.identifier=${showId}
          returning *`
  )
  return updated
}

export const createEpisode = async (
  showId: string,
  { title, description, slug, audio }: BaseEpisode
): Promise<Episode> => {
  const episode: Episode = {
    title,
    description,
    slug,
    audio,
    meta: { published: false },
    identifier: v4(),
    updated: moment(),
    created: moment()
  }
  const inserted: Episode = await single(
    sql`insert into episodes 
            (identifier, title, description, slug, audio, created, updated, meta)
            values 
            (${episode.identifier}, 
              ${episode.title}, 
              ${episode.description}, 
              ${episode.slug}, 
              ${episode.audio}, 
              ${episode.created}, 
              ${episode.updated},
              ${episode.meta})
            returning *`
  )
  const link: EpisodeLink = await single(
    sql`insert into link_show_episode 
            (identifier, "episode", show)
            values 
              (${v4()}, ${episode.identifier}, ${showId})
            returning *`
  )
  return inserted
}
export const updateEpisode = async (
  episodeId: string,
  { title, description, slug, audio, meta = {} }: BaseEpisode
): Promise<Episode> => {
  const currentEpisode: Episode = await single(
    sql`select * from episodes where episodes.identifier=${episodeId}`
  )
  let newAudio = currentEpisode.audio
  let newMeta = currentEpisode.meta
  if (
    (audio != currentEpisode.audio && newMeta && newMeta.published) ||
    !currentEpisode.audio
  ) {
    newAudio = audio
    newMeta = { published: false, last: currentEpisode.meta }
  }
  const updated: Episode = await single(
    sql`update episodes
            set 
              title=${title},
              description=${description},
              slug=${slug},
              audio=${newAudio},
              updated=${moment()},
              meta=${newMeta}
            where
              episodes.identifier=${episodeId}
            returning *`
  )
  return updated
}

export const getRSSBySlug = async (slug: string): Promise<string> => {
  const show = await getBySlug(slug)

  return 'null'
}
