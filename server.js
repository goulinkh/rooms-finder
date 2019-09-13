require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");

const { getFreeTimes } = require("./RoomController");

const db = async () => {
  try {
    await mongoose.connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("Connected to the database");
  } catch (err) {
    console.log("[Database(MongoDB)] Failed to connect to the datase");
    if (process.env.debug === "true") {
      console.log(err);
    }
  }
};
db();
const app = express();
app.get("/free-rooms", async (req, res, next) => {
  try {
    let { place, date } = req.query;
    console.log("{ place, date }", { place, date });
    res.json(await getFreeTimes({ date, place }));
  } catch (err) {
    next(err);
  }
});
app.use((err, req, res, _next) => {
  if (err && !res.headersSent) {
    if (err.message && err.message.match(/^\[custom\]/gi)) {
      res.status(404).send(err.message.replace(/^\[custom\]/gi, ""));
    } else {
      res.status(404).send("Requête invalide");
    }
  }
});
const port = process.env.PORT;
app.listen(port, () => console.log("listenning on port",port));
