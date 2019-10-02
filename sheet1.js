const fetch = require("node-fetch");
const { writeFileSync } = require("fs");
const buildings = require("./static/buildings.json");

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

(async () => {
  let rooms = await getAllRooms();
  for (let i = 0; i < rooms.length; i++) {
    rooms[i] = recognizeRoom(rooms[i]);
  }
  writeFileSync("./temp.json", JSON.stringify(rooms.filter(r => !r.building)));
})();

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

// const getRooms =async (building, ) =>{
// }
async function getRooms(query, pageNumber) {
  try {
    return await (await fetch(
      `https://edt.univ-tlse3.fr/calendar2/Home/ReadResourceListItems?myResources=false&searchTerm=${query}&pageSize=100&pageNumber=${pageNumber}&resType=102`
    )).json();
  } catch (e) {
    return null;
  }
}
