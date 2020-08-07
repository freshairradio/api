import express from 'express'
import userRoutes from './users/routes'
import showRoutes from './shows/routes'
import port from 'consts:port'
import fetch from 'node-fetch'
import cors from 'cors'
const app = express()
app.use(cors())
app.use(express.json())
app.use(async (req, res, next) => {
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
app.listen(port)
