const mongoose = require("mongoose");
const buildingSchema = mongoose.Schema({
  name: String,
  building: String
});

module.exports = mongoose.model("Rooms", buildingSchema);
