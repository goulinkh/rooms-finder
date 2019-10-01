require("dotenv").config();
const mongoose = require("mongoose");
const Redis = require("ioredis");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rfs = require("rotating-file-stream");
const morgan = require("morgan");
const path = require("path");
const yn = require("yn");
const { getFreeTimes, getRooms } = require("./RoomController");
let requests;
const app = express();
const init = async ({ app }) => {
  try {
    // ---- MongoDB Login ----
    await mongoose
      .connect(process.env.DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      })
      .catch(() =>
        console.log("[Database(MongoDB)] Failed to connect to the database")
      );
    console.log("Connected to the database");

    // ---- Redis Caching ----
    if (yn(process.env.CACHE)) {
      requests = new Redis(process.env.REDIS_URL);
    }
  } catch (err) {
    if (process.env.debug === "true") {
      console.log(err);
    }
  }
};
init({ app });

// ---- Requests logging ----
if (yn(process.env.LOG)) {
  const accessLogStream = rfs(
    `${new Date().toISOString().replace(/T.+/gi, "")}.log`,
    {
      interval: "1d",
      path: path.join(__dirname, "log")
    }
  );
  app.use(
    morgan(
      ":remote-addr - :method - :url - :status - :response-time ms:date[format] - :date[web] - :user-agent",
      {
        stream: accessLogStream
      }
    )
  );
}
// Nginx proxy
app.set("trust proxy", "loopback,uniquelocal");
app.use(helmet({ xssFilter: false }));
app.use(cors());
app.get("/", async (req, res, next) => {
  try {
    let { place, date } = req.query;
    const query = { place, date };

    if (requests) {
      let response;
      response = await requests.get(JSON.stringify(query));
      if (response) {
        res.json(JSON.parse(response));
      } else {
        const resp = await getFreeTimes({ date, place });
        requests.set(
          JSON.stringify(query),
          JSON.stringify(resp),
          "ex",
          60 * 60
        ); // ex: expiration in seconds
        res.json(resp);
      }
    } else {
      res.json(await getFreeTimes({ date, place }));
    }
  } catch (err) {
    next(err);
  }
});
const buildings = require("./buildings");
app.get("/buildings", async (_req, res) => {
  res.json(buildings);
});
app.get("/rooms", async (req, res, next) => {
  try {
    const { building } = req.query;
    res.json(await getRooms({ building }));
  } catch (err) {
    next(err);
  }
});
// Errors Handler
app.use((err, _req, res, _next) => {
  if (yn(process.env.debug)) {
    console.log(err);
  }
  if (err && !res.headersSent) {
    if (err.message && err.message.match(/^\[custom\]/gi)) {
      res
        .status(404)
        .json({ message: err.message.replace(/^\[custom\]/gi, "") });
    } else {
      res.status(404).send({ message: "Requête invalide" });
    }
  }
});
const port = process.env.PORT;
app.listen(port, () => console.log("listenning on port", port));
