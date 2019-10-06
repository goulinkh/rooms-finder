const fetch = require("node-fetch");
const yn = require("yn");
const buildings = require("../static/buildings.json");
const { Room } = require("../models");
async function updateRooms() {
  if (yn(process.env.LOG)) {
    console.log(`[${new Date().toISOString()}] Updating rooms list ...`);
  }
  try {
    let rooms = await getAllRooms();
    for (let i = 0; i < rooms.length; i++) {
      rooms[i] = recognizeRoom(rooms[i]);
    }
    rooms = rooms.filter(r => r.building);
    // Update the db
    await Room.deleteMany({});
    for (let i = 0; i < rooms.length; i++) {
      const room = rooms[i];
      try {
        await new Room({
          name: room.text,
          slug: room.id,
          departement: room.dept,
          building: room.building
        }).save();
      } catch (e) {
        if (yn(process.env.DEBUG)) {
          console.error("Failed to create db object for : ", room);
        }
      }
    }
    if (yn(process.env.LOG)) {
      console.log(`[${new Date().toISOString()}] Rooms update is done`);
    }
  } catch (e) {
    console.log("Failed to update rooms list");

    if (yn(process.env.DEGUB)) {
      console.error(e);
    }
  }
}

function recognizeRoom(room) {
  const guesses = buildings.filter(b => {
    if (b.match(new RegExp(`salles\\s.*`, "gi"))) {
      b = b.replace(new RegExp(`salles\\s`, "gi"), "");
      return room.text.match(new RegExp(`FSI\\s/\\s${b}`, "gi"));
    }
    return room.text.match(new RegExp(`(${b}\\s*-|\\(${b}\\))`, "gi"));
  });
  return {
    ...room,
    building: guesses[0]
  };
}

async function getAllRooms() {
  const rooms = [];
  const globalQuery = "fsi ";
  let rep = await getRooms(globalQuery, 1);
  rooms.push(...rep.results);
  let i = 2;
  while (rep.total && rep.total > 100 && rep.results && rep.results.length) {
    // There is more
    rep = await getRooms(globalQuery, i);
    rooms.push(...rep.results);
    ++i;
  }
  return rooms;
}

async function getRooms(query, pageNumber) {
  try {
    return await (await fetch(
      `https://edt.univ-tlse3.fr/calendar2/Home/ReadResourceListItems?myResources=false&searchTerm=${query}&pageSize=100&pageNumber=${pageNumber}&resType=102`
    )).json();
  } catch (e) {
    return null;
  }
}
async function searchRooms(query) {
  let rooms = await Room.find({
    // (FSI / )(Amphi) query (...etc)
    name: {
      $regex: new RegExp(`(${query}|^(.+\\/)\\s*(Amphi)?\\s*${query}.*)`),
      $options: "i"
    }
  });
  if (!rooms.length) {
    rooms = await Room.find({ name: query });
  }
  return rooms;
}

module.exports = { updateRooms, searchRooms };
