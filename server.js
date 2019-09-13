require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const Redis = require("ioredis");

const { getFreeTimes } = require("./RoomController");
const init = async () => {
  try {
    await mongoose
      .connect(process.env.DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      })
      .catch(() =>
        console.log("[Database(MongoDB)] Failed to connect to the database")
      );
    console.log("Connected to the database");
    return { redis: new Redis(process.env.REDIS_URL) };
  } catch (err) {
    if (process.env.debug === "true") {
      console.log(err);
    }
  }
};
let requests;
init().then(({ redis }) => (requests = redis));
const app = express();
app.get("/", async (req, res, next) => {
  try {
    let { place, date } = req.query;
    const query = { place, date };
    const response = await requests.get(JSON.stringify(query));
    if (response) {
      res.json(JSON.parse(response));
    } else {
      const resp = await getFreeTimes({ date, place });
      requests.set(JSON.stringify(query), JSON.stringify(resp));
      res.json(resp);
    }
  } catch (err) {
    next(err);
  }
});
app.use((err, _req, res, _next) => {
  if (err && !res.headersSent) {
    if (err.message && err.message.match(/^\[custom\]/gi)) {
      res.status(404).send(err.message.replace(/^\[custom\]/gi, ""));
    } else {
      res.status(404).send("Requête invalide");
    }
  }
});
const port = process.env.PORT;
app.listen(port, () => console.log("listenning on port", port));
