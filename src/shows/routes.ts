import Router from 'express-promise-router'
import {
  createShow,
  getAllForUser,
  updateShow,
  createEpisode,
  updateEpisode,
  getBySlug
} from './logic'
const router = Router()

router.get(`/`, async (req, res) => {
  res.send(await getAllForUser(req.userId))
})

router.post(`/`, async (req, res) => {
  res.send(await createShow(req.userId, req.body))
})

router.put(`/:identifier`, async (req, res) => {
  res.send(await updateShow(req.params.identifier, req.body))
})
router.get(`/:slug`, async (req, res) => {
  res.send(await getBySlug(req.params.slug))
})
router.get(`/:slug/rss`, async (req, res) => {
  res.set('Content-Type', 'application/rss+xml')
  res.send(await getRSSBySlug(req.params.slug))
})
router.post(`/:identifier/episodes`, async (req, res) => {
  res.send(await createEpisode(req.params.identifier, req.body))
})

router.put(`/:identifier/episodes/:eid`, async (req, res) => {
  res.send(await updateEpisode(req.params.eid, req.body))
})
export default router
