require("dotenv").config();
const mongoose = require("mongoose");
const fetch = require("node-fetch");

const getRooms = async () => {
  let buildingsList = [
    {
      name: "3A"
    },
    {
      name: "U4"
    },
    {
      name: "U2"
    },
    {
      name: "U3"
    },
    {
      name: "U1"
    },
    {
      name: "3TP2"
    },
    {
      name: "1A"
    },
    {
      name: "2A"
    },
    {
      name: "4A"
    },
    {
      name: "1R3"
    }
  ];
  // Fetch Rooms list from the API
  for (let i = 0; i < buildingsList.length; i++) {
    const building = buildingsList[i];

    building.rooms = await (await fetch(
      `https://edt.univ-tlse3.fr/calendar2/Home/ReadResourceListItems?myResources=false&searchTerm=${building.name}&pageSize=100&pageNumber=1&resType=102`
    )).json();

    // Some filtring
    building.rooms = await Promise.all(
      building.rooms.results.map(room => ({
        id: room.id
      }))
    );
  }
  // RES == buidingsList
  return buildingsList;
};

const Room = require("./models/room");
const db = async () => {
  try {
    await mongoose.connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("Connected to the database");
  } catch (err) {
    console.log("[Database(MongoDB)] Failed to connect to the datase");
    if (process.env.debug === "true") {
      console.log(err);
    }
  }
};

const updateRooms = async () => {
  await db();
  const bs = await getRooms();
  await Room.deleteMany({});
  for (let i = 0; i < bs.length; i++) {
    const b = bs[i];
    for (let j = 0; j < b.rooms.length; j++) {
      const name = b.rooms[j].id;
      await new Room({ name, building: b.name }).save();
    }
  }
  console.log("Rooms updated successfully");
  return bs;
};
updateRooms().then(() => process.exit(0));
