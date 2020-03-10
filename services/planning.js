const fetch = require("node-fetch");
const yn = require("yn");
const moment = require("moment-timezone");
const entites = new require("html-entities").XmlEntities;
const { Room, Planning } = require("../models");

function logger(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}
// TODO: Doc start format
async function getPlannings(rooms, start, end, building = null) {
  if (!(checkDateFormat(start) || checkDateFormat(end))) {
    throw new Error(
      "[custom]Format de date invalide: Annee-mois-jour (ex: 2019-09-01)"
    );
  }
  if (yn(process.env.LOG)) {
    logger(
      `Starting plannings fetch ${
        building ? "for " + building : ""
      }from ${start} to ${end}`
    );
  }
  try {
    const req = new URLSearchParams();
    const params = {
      start,
      end,
      resType: "102",
      calView: "agendaDay",
      "federationIds[]": rooms,
      colourScheme: "3"
    };
    for (let i = 0; i < Object.keys(params).length; i++) {
      const p = Object.keys(params)[i];
      if (Array.isArray(params[p])) {
        params[p].forEach(e => req.append(p, e));
      } else {
        req.append(p, params[p]);
      }
    }
    let plannings = await (
      await fetch("https://edt.univ-tlse3.fr/calendar2/Home/GetCalendarData", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
        },
        body: req.toString()
      })
    ).json();
    return plannings;
  } catch (e) {
    if (yn(process.env.DEBUG)) {
      console.error(e);
    }
    return null;
  }
}
/**
 * Retrouver la liste compléte des cours.
 * @param {string} building  Le nom du bâtiment reconnue par CELCAT
 */
async function getAllPlannings() {
  const rooms = await Room.find({});
  if (yn(process.env.LOG)) {
    logger("Started plannings fetching for", rooms.length, "Rooms");
  }
  const plannings = [];
  const months = getMonths(process.env.START, process.env.END);
  for (let i = 0; i < months.length - 1; i++) {
    const start = months[i];
    const end = months[i + 1];
    try {
      plannings.push(
        ...(await getPlannings(
          rooms.map(r => r.slug),
          start,
          end
        ))
      );
    } catch (e) {
      console.log("failed to fetch data");
    }
  }

  return plannings;
}
/**
 * Transforme les données d'un cours de CELCAT à un objet accepté par le modèle de bdd.
 * @param {Object} data Les données non parsées reçues
 */
function parsePlanning({ start, end, description }) {
  if (!(start && end && description)) return null;
  start = new Date(moment.tz(start, "Europe/Paris").format());
  end = new Date(moment.tz(end, "Europe/Paris").format());
  description = description.match(/.+/gi)[0];
  if (!(description && description.length)) return null;
  const rooms = description.split(",").map(e => entites.decode(e.trim()));
  return rooms.map(roomSlug => ({ start, end, roomSlug }));
}

async function updateAllplannings() {
  if (yn(process.env.LOG)) {
    logger(`Update all plannings started`);
  }
  await Planning.deleteMany({});
  const plannings = await getAllPlannings();
  for (let planning of plannings) {
    const plannings = parsePlanning(planning);
    if (plannings && plannings.length) {
      await Promise.all(
        plannings.map(planning => {
          new Planning(planning).save();
        })
      );
    }
  }
  if (yn(process.env.LOG)) {
    logger(`Update all plannings is done succesfully`);
  }
}
function checkDateFormat(date) {
  const match = date.toString().match(/20\d\d-\d\d-\d\d/gi);
  return match && match.length;
}

// TODO: doc start & end date(format)
function getMonths(start, end) {
  const months = [];
  for (var m = moment(start); m.isBefore(end); m.add(1, "months")) {
    months.push(m.format("YYYY-MM-DD"));
  }
  return months;
}

/**
 * Trouver les horraires libre pour chaque salle donnée
 * @param {String} room
 * @param {Date} start
 * @param {Date} end
 */
async function getFreePlanningsOneRoom(room, date) {
  // date == undefined => now
  date = moment(date).format("YYYY-MM-DD");
  let start = moment.tz(date + " 07:45:00", "Europe/Paris").utc().toDate();
  let end = moment.tz(date + " 20:00:00", "Europe/Paris").utc().toDate();
  const day = moment.tz(date, "Europe/Paris").utc().toDate()
  let plannings = await Planning.find({
    roomSlug: room,
    start: { $gte: day },
    end: {
      $lte: new Date(day.getTime()+24*3600*1000)
    }
  });
  console.log('plannings', plannings)
  if (!(plannings && plannings.length)) {
    return [{ start, end }];
  }
  plannings = plannings.sort((e1, e2) => e1.start > e2.start);
  const freePlannings = [];
  for (const planning of plannings) {
    if (planning.start <= start) {
      start = planning.end;
    } else {
      freePlannings.push({ start, end: planning.start });
      start = planning.end;
    }
  }
  if (start < end) {
    freePlannings.push({ start, end });
  }

  return freePlannings;
}
/**
 * La liste des horraires vide pour chaque salle donnée
 * @param {Room} rooms
 * @param {string} date
 */
async function getFreePlannings(rooms, date) {
  return Promise.all(
    rooms.map(async room => getFreePlanningsOneRoom(room.slug, date))
  );
}
module.exports = { updateAllplannings, getFreePlannings };
