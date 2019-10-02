require("dotenv").config();

const express = require("express");

const { connect: connectToDb } = require("./db");
const { router } = require("./routes");
const { updateRooms } = require("./services/room");
(async () => {
  // Bootstrap
  await connectToDb();

  // TODO: cron daily
  // await updateRooms();

  // Server startup
  const app = express();

  app.use(router);

  app.listen(process.env.PORT, () =>
    console.log("Listenning on port", process.env.PORT)
  );
})();
