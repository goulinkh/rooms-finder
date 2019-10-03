const mongoose = require("mongoose");
const roomSchema = new mongoose.Schema({
  name: String,
  slug: String,
  departement: String,
  building: String
});
module.exports = mongoose.model("Rooms", roomSchema);
