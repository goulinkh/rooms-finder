require("dotenv").config();

const express = require("express");
const yn = require("yn");
const schedule = require("node-schedule");

const { connect: connectToDb } = require("./db");
const { router } = require("./routes");
const { post, pre } = require("./middlewares");
const updater = require("./updater");
(async () => {
  try {
    // Bootstrap
    await connectToDb();

    schedule.scheduleJob("0 */2 * * *", async function() {
      await updater();
    });

    // Server startup
    const app = express();

    pre.forEach(m => app.use(m));

    app.use(router);

    post.forEach(m => app.use(m));

    app.listen(process.env.PORT, () =>
      console.log("Listenning on port", process.env.PORT)
    );
  } catch (e) {
    console.log("Failed to start the server");
    if (yn(process.env.DEBUG)) {
      console.log(e);
    }
  }
})();
