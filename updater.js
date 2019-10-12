require("dotenv").config();

const yn = require("yn");

const { connect: connectToDb } = require("./db");
const { updateRooms } = require("./services/room");
const { updateAllplannings } = require("./services/planning");

exports = async () => {
  try {
    // Bootstrap
    await connectToDb();

    // TODO: cron daily
    await updateRooms();
    await updateAllplannings();
    // console.log(
    //   await getFreePlannings(await searchRooms("u3-01"), "2019-10-07")
    // );
  } catch (e) {
    console.log("Update failure");
    if (yn(process.env.DEBUG)) {
      console.log(e);
    }
  }
};
