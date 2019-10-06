require("dotenv").config();

const express = require("express");

const { connect: connectToDb } = require("./db");
const { router } = require("./routes");
const { updateRooms, searchRooms } = require("./services/room");
const { updateAllplannings, getFreePlannings } = require("./services/planning");

(async () => {
  // Bootstrap
  await connectToDb();

  // TODO: cron daily
  // await updateRooms();
  console.log(await getFreePlannings(await searchRooms("u3-01"), "2019-10-07"));

  // Server startup
  const app = express();

  app.use(router);

  app.listen(process.env.PORT, () =>
    console.log("Listenning on port", process.env.PORT)
  );
})();
