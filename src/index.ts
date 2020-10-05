import express from "express";
import showRoutes from "./shows/routes";
import fetch from "node-fetch";
import cors from "cors";
import { getRSSBySlug, getAllShows, getBySlugPublished } from "./shows/logic";
const app = express();
import { config } from "dotenv";
config();
app.use(cors());
app.use(express.json());
app.get(`/rss/:slug`, async (req, res) => {
  res.set("Content-Type", "application/rss+xml");
  res.send(await getRSSBySlug(req.params.slug));
});
app.get(`/public/shows/`, async (req, res) => {
  res.send(await getAllShows());
});

app.get(`/public/shows/:slug`, async (req, res) => {
  res.send(await getBySlugPublished(req.params.slug));
});
app.use(async (req, res, next) => {
  const user = await fetch(`https://identity.freshair.radio/user`, {
    headers: {
      authorization: req.headers.authorization
    }
  });
  if (user.status != 200) {
    return res.status(401).json({ error: "Please provide a valid auth token" });
  }
  let json = await user.json();
  req.userId = json.id;
  console.log(json);
  return next();
});
app.use(`/shows`, showRoutes);
app.listen(process.env.PORT);
