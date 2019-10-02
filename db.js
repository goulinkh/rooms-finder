const mongoose = require("mongoose");
const yn = require("yn");
// TODO: Doc process.env
exports.connect = async () => {
  try {
    await mongoose.connect(process.env.DB, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    if (yn(process.env.LOG)) {
      console.log("Connected to the db");
    }
  } catch (e) {
    console.log("DB connection problem");
    if (yn(process.env.DEBUG)) {
      console.error(e);
    }
    process.exit(2);
  }
};
