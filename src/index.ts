import express from 'express'
import userRoutes from './users/routes'
import showRoutes from './shows/routes'
import shared_api_secret from 'consts:shared_api_secret'
import fetch from 'node-fetch'
import cors from 'cors'
import { getRSSBySlug } from './shows/logic'
const app = express()
app.use(cors())
app.use(express.json())
app.get(`/rss/:slug`, async (req, res) => {
  res.set('Content-Type', 'application/rss+xml')
  res.send(await getRSSBySlug(req.params.slug))
})
app.use(async (req, res, next) => {
  if (req.headers.authorization === shared_api_secret) {
    req.isSuper = true
    return next()
  }
  req.isSuper = false
  const user = await fetch(`https://identity.freshair.radio/user`, {
    headers: {
      authorization: req.headers.authorization
    }
  })
  if (user.status != 200) {
    return res.status(401).json({ error: 'Please provide a valid auth token' })
  }
  req.userId = (await user.json()).id

  return next()
})
app.use(`/users`, userRoutes)
app.use(`/shows`, showRoutes)
app.listen(process.env.PORT)
