const fetch = require("node-fetch");
const Room = require("./models/room");
const { URLSearchParams } = require("url");
const getDate = date => {
  if (!date) {
    return new Date().toISOString().replace(/T.+/gi, "");
  } else {
    if (date.match(/\d{4}(-\d{2}){2}/gi)) {
      return date;
    } else {
      return new Date(date).toISOString().replace(/T.+/gi, "");
    }
  }
};
const toUTCDate = l =>
  l.map(e => ({
    ...e,
    freeSchedules: e.freeSchedules.map(d => ({
      start: new Date(new Date(d.start) - 2 * 3600 * 1000),
      end: new Date(new Date(d.end) - 2 * 3600 * 1000)
    }))
  }));
exports.getRooms = async ({ building }) => {
  let rooms;
  if (building) {
    rooms = await Room.find({
      building: {
        $regex: new RegExp(`^${building}$`),
        $options: "i"
      }
    });
  } else {
    rooms = await Room.find({});
  }
  return (rooms || []).map(r => ({
    name: r.name,
    building: r.building
  }));
};
exports.getFreeTimes = async ({ date, place }) => {
  date = getDate(date);
  if (!place) {
    // All buildings
    throw new Error("[custom]Il faut donner une salle ou un bâtiment");
  }
  // place = place.replace(/(é|è|ê)/gi, "e").replace(/(à|â)/gi, "a");
  // Priority for rooms
  let rooms = await Room.find({ name: place });
  if (!rooms.length) {
    rooms = await Room.find({
      // (FSI / )(Amphi) place (...etc)
      name: {
        $regex: new RegExp(`(${place}|^(.+\\/)\\s*(Amphi)?\\s*${place}.*)`),
        $options: "i"
      }
    });
  }
  if (rooms && rooms.length) {
    const result = [];

    for (let i = 0; i < rooms.length; i++) {
      const room = rooms[i];
      const plannings = await getPlanning({ date, room: room.name });
      let start = new Date(date + "T07:45:00.00Z");
      let to = new Date(date + "T20:00:00.00Z");
      const freeSchedules = [];
      if (!plannings.length) {
        freeSchedules.push({ start, end: to });
      } else {
        for (let j = 0; j < plannings.length; j++) {
          const lesson = plannings[j];
          if (start < lesson.start) {
            freeSchedules.push({ start, end: lesson.start });
            start = lesson.end;
          } else {
            start = lesson.end;
          }
          if (j == plannings.length - 1 && lesson.end < to) {
            freeSchedules.push({ start: lesson.end, end: to });
          }
        }
      }
      result.push({ room: room.name, building: room.building, freeSchedules });
    }
    // To UTC
    return toUTCDate(result);
  } else {
    throw new Error("[custom]Salle non trouvé");
  }
};
const getPlanning = async ({ date, room }) => {
  const req = new URLSearchParams();
  const params = {
    start: date,
    end: date,
    resType: "102",
    calView: "agendaDay",
    "federationIds[]": room,
    colourScheme: "3"
  };
  for (let i = 0; i < Object.keys(params).length; i++) {
    const p = Object.keys(params)[i];

    req.append(p, params[p]);
  }
  let plannings = await (await fetch(
    "https://edt.univ-tlse3.fr/calendar2/Home/GetCalendarData",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
      },
      body: req.toString()
    }
  )).json();
  for (let i = 0; i < plannings.length; i++) {
    const lesson = plannings[i];
    if (lesson.start && lesson.end) {
      plannings[i] = {
        start: new Date(lesson.start + ".00Z"),
        end: new Date(lesson.end + ".00Z"),
        room: lesson.description
          .match(/^.+(\r|\n|<.+\/>)/gi)[0]
          .replace(/(\r|\n|<.+\/>)$/gi, "")
      };
    } else {
      plannings.splice(i);
    }
  }
  // sort by date
  plannings = plannings.sort((e1, e2) => e1.start > e2.start);
  return plannings;
};
