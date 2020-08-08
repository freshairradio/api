import {
  Show,
  BaseShow,
  ShowLink,
  BaseEpisode,
  Episode,
  EpisodeLink,
  InflatedShow
} from './types'
import Podcast from 'podcast'
import { multiple, sql, single } from '../db'
import { v4 } from 'uuid'
import moment from 'moment'
import pat from 'consts:pat'
import { Octokit } from '@octokit/core'
import fetch from 'node-fetch'
const octokit = new Octokit({ auth: pat })
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
            shows.identifier
            `
  )
}
export const getBySlug = async (slug: string): Promise<InflatedShow> => {
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
export const deleteEpisode = async (episodeId: string): Promise<Episode> => {
  await single(sql`delete from link_show_episode where episode=${episodeId}`)

  return await single(
    sql`delete from episodes where identifier=${episodeId} returning *`
  )
}
export const updateEpisode = async (
  showId: string,
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
    newMeta = {
      published: false,
      ...(currentEpisode.meta.published ? { last: currentEpisode.meta } : {})
    }
    fetch(process.env.WORKER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        audio,
        update_url: `http://app:${process.env.PORT}/shows/${showId}/episodes/${episodeId}/meta`
      })
    })
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

export const superSetMeta = async (
  episodeId: string,
  { meta = {} }: BaseEpisode
): Promise<Episode> => {
  const updated: Episode = await single(
    sql`update episodes
            set 
              meta=${meta}
            where
              episodes.identifier=${episodeId}
            returning *`
  )
  return updated
}

export const getRSSBySlug = async (slug: string): Promise<string> => {
  const { title, description, picture, meta, episodes } = await getBySlug(slug)

  const feed = new Podcast({
    title: title,
    description,
    feed_url: `https://api.freshair.radio/shows/${slug}/rss`,
    site_url: `https://freshair.radio/shows/${slug}`,
    image_url: picture,
    author: `Freshair Radio`,
    language: 'en',
    ttl: '60',
    itunesAuthor: `Freshair Radio`,
    itunesSummary: description,
    itunesOwner: { name: 'Freshair', email: 'manager@freshair.org.uk' },
    itunesExplicit: false,
    itunesCategory: [meta.category].filter(Boolean).map((c) => ({ text: c })),
    itunesImage: picture
  })
  await Promise.all(
    episodes
      .filter((e) => e.meta.published || (e.meta.last && e.meta.last.published))
      .map(
        async ({
          identifier: epIdent,
          title,
          created,
          description,
          audio,
          meta
        }) => {
          console.log(meta)
          feed.addItem({
            title: title,
            itunesTitle: title,
            itunesAuthor: `Freshair Radio`,

            description: description,
            url: `https://freshair.radio/shows/${slug}#episode-${epIdent}`,
            enclosure: {
              url: meta.audio,
              type: 'audio/mpeg',
              size: Math.round(meta.length)
            }, // optional enclosure
            date: created, // any format that js Date can parse.
            itunesExplicit: false,
            itunesSummary: description,
            itunesDuration: Math.round(meta.length)
          })
        }
      )
  )

  return feed.buildXml()
}
