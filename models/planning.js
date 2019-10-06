const mongoose = require("mongoose");
const planningSchema = new mongoose.Schema({
  roomSlug: String,
  start: Date,
  end: Date
});
module.exports = mongoose.model("Plannings", planningSchema);
