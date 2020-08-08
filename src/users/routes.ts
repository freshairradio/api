import Router from 'express-promise-router'
import { single, multiple, sql } from '../db'
import moment from 'moment'
import { v4 } from 'uuid'
const router = Router()
export interface User {
  identifier: string
  name: string
  username: string
  bio: string
  profile_picture: string
  created: moment.Moment
  updated: moment.Moment
}
router.get(`/`, async (req, res) => {
  const users: User[] = await multiple(sql`select * from users`)
  res.send(users)
})

router.post(`/`, async (req, res) => {
  const user: User = req.body
  user.created = moment()
  user.updated = moment()
  const inserted: User = await single(sql`
    insert into users (identifier, name, username, bio, profile_picture, created, updated)
    values (${user.identifier}, ${user.name}, ${user.username}, ${user.bio}, ${user.profile_picture}, ${user.created}, ${user.updated})
    returning *`)
  res.send(inserted)
})
router.get(`/me`, async (req, res) => {
  const user: User = await single(sql`
  select * from users where identifier=${req.userId}`)
  return res.send(user)
})
router.put(`/me`, async (req, res) => {
  const user: User = req.body
  const updated: User = await single(sql`
    update users 
    set
      identifier = ${req.userId},
      name = ${user.name},
      username = ${user.username},
      bio = ${user.bio},
      profile_picture = ${user.profile_picture}, 
      updated = ${moment()}
    returning *`)
  return res.send(updated)
})
export default router
