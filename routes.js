const router = (exports.router = require("express").Router());

const {
  searchRooms,
  getRoomsByBuilding
} = require("./services/room");
const { getFreePlannings } = require("./services/planning");

const buildings = require("./static/buildings");

router.get("/", async (req, res, next) => {
  try {
    const { place, date } = req.query;
    if (!place && !date) {
      throw new Error(
        "[custom]Il faut donner une salle ou un bâtiment (query: place=exp&[date=YYYY-MM-DD])"
      );
    }
    let rooms = await searchRooms(place);
    // eslint-disable-next-line require-atomic-updates
    rooms = (await getFreePlannings(rooms, date)).map((freeSchedules, i) => ({
      room: rooms[i].name,
      building: rooms[i].building,
      freeSchedules
    }));
    res.json(rooms);
  } catch (e) {
    next(e);
  }
});

router.get("/buildings", (_req, res, next) => {
  try {
    res.json(buildings.map(b => ({ name: b })));
  } catch (e) {
    next(e);
  }
});
const getRooms = async (req, res, next) => {
  try {
    let { building } = req.params;
    if (!building) building = req.query.building;
    res.json(await getRoomsByBuilding(building));
  } catch (e) {
    next(e);
  }
};
router.get("/rooms/:building", getRooms);
router.get("/rooms", getRooms);
